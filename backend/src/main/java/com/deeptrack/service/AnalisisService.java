package com.deeptrack.service;

import com.deeptrack.dto.AnalisisDTO;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalisisService {
    private final SondaRepository sondas;
    private final LecturaRepository lecturas;

    public AnalisisService(SondaRepository sondas, LecturaRepository lecturas) {
        this.sondas = sondas;
        this.lecturas = lecturas;
    }

    @Transactional(readOnly = true)
    public AnalisisDTO consultar(LocalDate desde, LocalDate hasta, List<String> ids) {
        var intervalo = IntervaloAnalisis.validar(desde, hasta, LocalDateTime.now());
        List<String> seleccion = ids == null ? List.of() : ids.stream().distinct().toList();
        if (seleccion.size() > 5 || (ids != null && ids.size() > 5)) {
            throw ApiException.badRequest("Selecciona hasta cinco sondas");
        }
        Map<String, Sonda> inventario = sondas.findAll().stream()
                .collect(Collectors.toMap(Sonda::getIdSonda, s -> s));
        if (!inventario.keySet().containsAll(seleccion)) {
            throw ApiException.badRequest("La selección contiene una sonda inexistente");
        }
        var activas = inventario.values().stream().filter(s -> "ACTIVA".equals(s.getEstado())).toList();
        Set<String> requeridas = activas.stream().map(Sonda::getIdSonda).collect(Collectors.toSet());
        requeridas.addAll(seleccion);

        Map<String, DoubleSummaryStatistics> total = new HashMap<>();
        Map<String, Map<LocalDate, DoubleSummaryStatistics>> diario = new HashMap<>();
        Set<String> comparadas = new HashSet<>(seleccion);
        // Lotes acotados para no superar el límite de parámetros de SQL Server.
        List<String> lote = new ArrayList<>(requeridas);
        for (int i = 0; i < lote.size(); i += 1000) {
            for (Lectura l : lecturas.findIntervalo(lote.subList(i, Math.min(i + 1000, lote.size())),
                    intervalo.inicio(), intervalo.fin(), intervalo.ahora())) {
                Double valor = l.getProfundidadM();
                if (valor == null || !Double.isFinite(valor)) continue;
                total.computeIfAbsent(l.getIdSonda(), k -> new DoubleSummaryStatistics()).accept(valor);
                if (comparadas.contains(l.getIdSonda())) {
                    diario.computeIfAbsent(l.getIdSonda(), k -> new HashMap<>())
                            .computeIfAbsent(l.getFechaHora().toLocalDate(), k -> new DoubleSummaryStatistics()).accept(valor);
                }
            }
        }
        List<AnalisisDTO.Serie> series = seleccion.stream().map(id -> {
            Sonda s = inventario.get(id);
            var dias = diario.getOrDefault(id, Map.of());
            return new AnalisisDTO.Serie(id, s.getCuadrante(), s.getEstado(),
                    desde.datesUntil(hasta.plusDays(1)).map(d -> {
                        var stats = dias.get(d);
                        return new AnalisisDTO.Dia(d, stats == null ? null : stats.getAverage(),
                                stats == null ? 0 : stats.getCount());
                    }).toList());
        }).toList();

        Map<String, List<Sonda>> grupos = activas.stream().collect(Collectors.groupingBy(Sonda::getCuadrante,
                TreeMap::new, Collectors.toList()));
        List<AnalisisDTO.Cuadrante> cuadrantes = grupos.entrySet().stream().map(e -> {
            var datos = e.getValue().stream().map(s -> total.get(s.getIdSonda())).filter(Objects::nonNull).toList();
            var media = datos.stream().mapToDouble(DoubleSummaryStatistics::getAverage).average();
            return new AnalisisDTO.Cuadrante(e.getKey(), e.getValue().size(), datos.size(),
                    datos.stream().mapToLong(DoubleSummaryStatistics::getCount).sum(),
                    media.isPresent() ? media.getAsDouble() : null);
        }).toList();
        return new AnalisisDTO(desde, hasta, series, cuadrantes);
    }
}
