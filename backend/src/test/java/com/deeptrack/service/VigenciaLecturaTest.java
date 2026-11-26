package com.deeptrack.service;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class VigenciaLecturaTest {
    private final LocalDateTime ahora = LocalDateTime.of(2026, 11, 26, 12, 0);

    @Test
    void distingueAusenciaFuturoYUmbralInclusivo() {
        assertEquals("SIN_DATOS", VigenciaLectura.evaluar(null, ahora, 48));
        assertEquals("FECHA_FUTURA", VigenciaLectura.evaluar(ahora.plusSeconds(1), ahora, 48));
        assertEquals("RECIENTE", VigenciaLectura.evaluar(ahora.minusHours(48), ahora, 48));
        assertEquals("ATRASADA", VigenciaLectura.evaluar(ahora.minusHours(48).minusSeconds(1), ahora, 48));
        assertEquals("SIN_CRITERIO", VigenciaLectura.evaluar(ahora.minusDays(3), ahora, 0));
    }
}
