package com.deeptrack.service;

import com.deeptrack.dto.ResumenValleDTO;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.TemporalAdjusters;
import java.util.DoubleSummaryStatistics;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/** Estadísticas descriptivas agregadas, sin confundir promedios con una medición hidrológica regional. */
@Service
public class EstadisticasService {
    private final SondaRepository sondas;
    private final LecturaRepository lecturas;

    public EstadisticasService(SondaRepository sondas, LecturaRepository lecturas) {
        this.sondas = sondas;
        this.lecturas = lecturas;
    }

    @Transactional(readOnly = true)
    public ResumenValleDTO resumen(String periodo) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDate hoy = ahora.toLocalDate();
        LocalDate inicio = switch (periodo) {
            case "dia" -> hoy;
            case "semana" -> hoy.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case "mes" -> YearMonth.from(hoy).atDay(1);
            default -> throw ApiException.badRequest("Periodo inválido. Usa: dia, semana o mes");
        };
        // Hasta mañana (exclusivo), para incluir las lecturas del día actual.
        LocalDateTime desde = inicio.atStartOfDay();
        LocalDateTime hasta = hoy.plusDays(1).atStartOfDay();

        Set<String> idsActivos = sondas.findAll().stream()
                .filter(s -> "ACTIVA".equals(s.getEstado()))
                .map(Sonda::getIdSonda)
                .collect(Collectors.toSet());

        List<Lectura> disponibles = idsActivos.isEmpty() ? List.of() : lecturas
                .findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(desde, hasta)
                .stream()
                .filter(l -> !l.getFechaHora().isAfter(ahora))
                .filter(l -> idsActivos.contains(l.getIdSonda()))
                .filter(l -> l.getProfundidadM() != null && Double.isFinite(l.getProfundidadM()))
                .toList();

        Map<String, DoubleSummaryStatistics> porSonda = disponibles.stream()
                .collect(Collectors.groupingBy(Lectura::getIdSonda,
                        Collectors.summarizingDouble(Lectura::getProfundidadM)));

        DoubleSummaryStatistics medias = porSonda.values().stream()
                .mapToDouble(DoubleSummaryStatistics::getAverage)
                .summaryStatistics();

        return new ResumenValleDTO(periodo, inicio, hoy,
                idsActivos.size(), porSonda.size(), disponibles.size(),
                medias.getCount() == 0 ? null : redondear(medias.getAverage()),
                medias.getCount() == 0 ? null : redondear(medias.getMin()),
                medias.getCount() == 0 ? null : redondear(medias.getMax()));
    }

    private static double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
