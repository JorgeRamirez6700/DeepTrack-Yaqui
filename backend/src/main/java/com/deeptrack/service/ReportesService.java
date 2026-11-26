package com.deeptrack.service;

import com.deeptrack.dto.ResumenMensualDTO;
import com.deeptrack.dto.ResumenMensualDTO.DetalleSondaDTO;
import com.deeptrack.dto.TendenciaMensualDTO;
import com.deeptrack.dto.TendenciaMensualDTO.PuntoMensualDTO;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Estadística descriptiva: una media por sonda y luego una media de esas medias.
 * No representa una estimación espacial del nivel del acuífero.
 */
@Service
public class ReportesService {
    private final SondaRepository sondas;
    private final LecturaRepository lecturas;

    public ReportesService(SondaRepository sondas, LecturaRepository lecturas) {
        this.sondas = sondas;
        this.lecturas = lecturas;
    }

    @Transactional(readOnly = true)
    public ResumenMensualDTO reporte(int anio, int mes) {
        YearMonth periodo = validarPeriodo(anio, mes);
        Map<String, Sonda> activas = activas();
        List<Lectura> datos = consultar(periodo.atDay(1), periodo.plusMonths(1).atDay(1), activas.keySet());
        Map<String, DoubleSummaryStatistics> grupos = datos.stream().collect(
            Collectors.groupingBy(Lectura::getIdSonda,
                Collectors.summarizingDouble(Lectura::getProfundidadM)));
        List<DetalleSondaDTO> detalles = activas.values().stream()
            .sorted(Comparator.comparing(Sonda::getIdSonda))
            .map(s -> {
                DoubleSummaryStatistics stats = grupos.get(s.getIdSonda());
                return new DetalleSondaDTO(s.getIdSonda(), s.getCuadrante(),
                    stats == null ? 0 : stats.getCount(),
                    stats == null ? null : round(stats.getAverage()),
                    stats == null ? null : round(stats.getMin()),
                    stats == null ? null : round(stats.getMax()));
            }).toList();
        DoubleSummaryStatistics medias = grupos.values().stream()
            .mapToDouble(DoubleSummaryStatistics::getAverage).summaryStatistics();
        return new ResumenMensualDTO(anio, mes, activas.size(), grupos.size(), datos.size(),
            medias.getCount() == 0 ? null : round(medias.getAverage()), detalles);
    }

    @Transactional(readOnly = true)
    public TendenciaMensualDTO tendencia(int meses) {
        if (meses < 2 || meses > 24)
            throw ApiException.badRequest("El periodo debe abarcar entre 2 y 24 meses");
        YearMonth actual = YearMonth.now();
        YearMonth inicio = actual.minusMonths(meses - 1L);
        Map<String, Sonda> activas = activas();
        List<Lectura> datos = consultar(inicio.atDay(1), actual.plusMonths(1).atDay(1), activas.keySet());
        Map<YearMonth, Map<String, DoubleSummaryStatistics>> porMes = datos.stream()
            .collect(Collectors.groupingBy(l -> YearMonth.from(l.getFechaHora()),
                Collectors.groupingBy(Lectura::getIdSonda,
                    Collectors.summarizingDouble(Lectura::getProfundidadM))));
        List<PuntoMensualDTO> puntos = new ArrayList<>();
        for (int i = 0; i < meses; i++) {
            YearMonth mes = inicio.plusMonths(i);
            Map<String, DoubleSummaryStatistics> porSonda = porMes.getOrDefault(mes, Map.of());
            DoubleSummaryStatistics medias = porSonda.values().stream()
                .mapToDouble(DoubleSummaryStatistics::getAverage).summaryStatistics();
            long n = porSonda.values().stream().mapToLong(DoubleSummaryStatistics::getCount).sum();
            puntos.add(new PuntoMensualDTO(mes.toString(), porSonda.size(), n,
                medias.getCount() == 0 ? null : round(medias.getAverage())));
        }
        return new TendenciaMensualDTO(puntos);
    }

    private static YearMonth validarPeriodo(int anio, int mes) {
        if (anio < 2000 || anio > 2100 || mes < 1 || mes > 12)
            throw ApiException.badRequest("Año o mes inválido");
        YearMonth periodo = YearMonth.of(anio, mes);
        if (periodo.isAfter(YearMonth.now()))
            throw ApiException.badRequest("No se permiten meses futuros");
        return periodo;
    }

    private Map<String, Sonda> activas() {
        return sondas.findAll().stream()
            .filter(s -> "ACTIVA".equals(s.getEstado()))
            .collect(Collectors.toMap(Sonda::getIdSonda, s -> s));
    }

    private List<Lectura> consultar(LocalDate desde, LocalDate hasta, Set<String> idsActivos) {
        if (idsActivos.isEmpty()) return List.of();
        LocalDateTime ahora = LocalDateTime.now();
        return lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(
                desde.atStartOfDay(), hasta.atStartOfDay()).stream()
            .filter(l -> !l.getFechaHora().isAfter(ahora))
            .filter(l -> idsActivos.contains(l.getIdSonda()))
            .filter(l -> l.getProfundidadM() != null && Double.isFinite(l.getProfundidadM()))
            .toList();
    }

    private static double round(double n) {
        return Math.round(n * 100.0) / 100.0;
    }
}
