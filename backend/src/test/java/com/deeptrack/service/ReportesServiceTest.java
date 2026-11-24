package com.deeptrack.service;

import com.deeptrack.dto.ResumenMensualDTO;
import com.deeptrack.dto.TendenciaMensualDTO;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportesServiceTest {
    @Mock SondaRepository sondas;
    @Mock LecturaRepository lecturas;
    private ReportesService service;

    @BeforeEach
    void setup() { service = new ReportesService(sondas, lecturas); }

    private Sonda sonda(String id, String estado) {
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setCuadrante("A1");
        s.setEstado(estado);
        return s;
    }

    @Test
    void mensualPonderaPorSondaEIncluyeAusentes() {
        YearMonth mes = YearMonth.now().minusMonths(1);
        when(sondas.findAll()).thenReturn(List.of(
            sonda("A", "ACTIVA"), sonda("B", "ACTIVA"), sonda("SIN-DATOS", "ACTIVA"),
            sonda("C", "INACTIVA")));
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
            .thenReturn(List.of(
                new Lectura("A", 10.0, mes.atDay(2).atStartOfDay()),
                new Lectura("A", 10.0, mes.atDay(3).atStartOfDay()),
                new Lectura("A", 10.0, mes.atDay(4).atStartOfDay()),
                new Lectura("B", 20.0, mes.atDay(4).atStartOfDay()),
                new Lectura("C", 100.0, mes.atDay(5).atStartOfDay())));
        ResumenMensualDTO resultado = service.reporte(mes.getYear(), mes.getMonthValue());
        assertEquals(3, resultado.sondasActivas());
        assertEquals(2, resultado.sondasConDatos());
        assertEquals(4, resultado.lecturas());
        assertEquals(15.0, resultado.profundidadMediaM());
        assertEquals(0, resultado.sondas().stream().filter(s -> s.idSonda().equals("SIN-DATOS"))
                .findFirst().orElseThrow().lecturas());
        assertNull(resultado.sondas().stream().filter(s -> s.idSonda().equals("SIN-DATOS"))
                .findFirst().orElseThrow().promedioM());
    }

    @Test
    void tendenciaConservaMesesSinLecturas() {
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "ACTIVA")));
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
            .thenReturn(List.of(
                new Lectura("A", 12.0, YearMonth.now().atDay(1).atStartOfDay())));
        TendenciaMensualDTO resultado = service.tendencia(6);
        assertEquals(6, resultado.meses().size());
        assertNull(resultado.meses().get(0).profundidadMediaM());
        assertEquals(12.0, resultado.meses().get(5).profundidadMediaM());
    }

    @Test
    void rechazaMesFuturoYPeriodosInvalidos() {
        YearMonth futuro = YearMonth.now().plusMonths(1);
        assertEquals(400, assertThrows(ApiException.class,
            () -> service.reporte(futuro.getYear(), futuro.getMonthValue())).getStatus().value());
        assertEquals(400, assertThrows(ApiException.class,
            () -> service.reporte(2020, 13)).getStatus().value());
        assertEquals(400, assertThrows(ApiException.class,
            () -> service.tendencia(25)).getStatus().value());
        verifyNoInteractions(sondas, lecturas);
    }
    @Test
    void mensualNoDescartaLecturasFirmadasNegativas() {
        YearMonth mes = YearMonth.now().minusMonths(1);
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "ACTIVA")));
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
            .thenReturn(List.of(
                new Lectura("A", -7.0, mes.atDay(2).atStartOfDay()),
                new Lectura("A", 3.0, mes.atDay(3).atStartOfDay())));
        ResumenMensualDTO resultado = service.reporte(mes.getYear(), mes.getMonthValue());
        assertEquals(2, resultado.lecturas());
        assertEquals(-2.0, resultado.profundidadMediaM());
        assertEquals(-7.0, resultado.sondas().get(0).minimoM());
    }

    @Test
    void tendenciaIncluyeLecturasFirmadasNegativas() {
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "ACTIVA")));
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
            .thenReturn(List.of(
                new Lectura("A", -6.0, YearMonth.now().atDay(1).atStartOfDay())));
        TendenciaMensualDTO resultado = service.tendencia(6);
        assertEquals(-6.0, resultado.meses().get(5).profundidadMediaM());
    }
}
