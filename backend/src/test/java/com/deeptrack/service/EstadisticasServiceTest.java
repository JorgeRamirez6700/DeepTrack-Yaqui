package com.deeptrack.service;

import com.deeptrack.dto.ResumenValleDTO;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EstadisticasServiceTest {
    @Mock SondaRepository sondas;
    @Mock LecturaRepository lecturas;
    EstadisticasService service;

    @BeforeEach
    void setUp() {
        service = new EstadisticasService(sondas, lecturas);
    }

    private Sonda sonda(String id, String estado) {
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setEstado(estado);
        return s;
    }

    @Test
    void mediasPorSondaEvitanSesgoPorFrecuencia() {
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "ACTIVA"), sonda("B", "ACTIVA"), sonda("C", "INACTIVA")));
        LocalDateTime ahora = LocalDateTime.now();
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
                .thenReturn(List.of(
                        new Lectura("A", 10.0, ahora.minusHours(3)),
                        new Lectura("A", 10.0, ahora.minusHours(2)),
                        new Lectura("A", 10.0, ahora.minusHours(1)),
                        new Lectura("B", 20.0, ahora.minusHours(1)),
                        new Lectura("C", 100.0, ahora.minusHours(1))));

        ResumenValleDTO resultado = service.resumen("mes");
        assertEquals(2, resultado.sondasActivas());
        assertEquals(2, resultado.sondasConDatos());
        assertEquals(4, resultado.lecturas());
        assertEquals(15.0, resultado.profundidadMediaM());
        assertEquals(10.0, resultado.minimaMediaPorSondaM());
        assertEquals(20.0, resultado.maximaMediaPorSondaM());
    }

    @Test
    void sinLecturasExponeCoberturaCeroSinInventarPromedio() {
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "ACTIVA")));
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
                .thenReturn(List.of());
        ResumenValleDTO resultado = service.resumen("dia");
        assertEquals(1, resultado.sondasActivas());
        assertEquals(0, resultado.sondasConDatos());
        assertNull(resultado.profundidadMediaM());
    }

    @Test
    void rechazaPeriodoInvalido() {
        ApiException ex = assertThrows(ApiException.class, () -> service.resumen("decada"));
        assertEquals(400, ex.getStatus().value());
        verifyNoInteractions(sondas, lecturas);
    }
    @Test
    void incluyeLecturasFirmadasNegativasEnMedias() {
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "ACTIVA")));
        LocalDateTime ahora = LocalDateTime.now();
        when(lecturas.findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(any(), any()))
            .thenReturn(List.of(
                new Lectura("A", -5.0, ahora.minusHours(2)),
                new Lectura("A", 3.0, ahora.minusHours(1))));
        ResumenValleDTO resultado = service.resumen("mes");
        assertEquals(2, resultado.lecturas());
        assertEquals(-1.0, resultado.profundidadMediaM());
        assertEquals(-1.0, resultado.minimaMediaPorSondaM());
    }
    @Test
    void sinActivasNoConsultaTablaDeLecturas() {
        when(sondas.findAll()).thenReturn(List.of(sonda("A", "RETIRADA")));
        var resumen = service.resumen("mes");
        assertEquals(0, resumen.sondasActivas());
        assertEquals(0, resumen.lecturas());
        assertNull(resumen.profundidadMediaM());
        verifyNoInteractions(lecturas);
    }
}
