package com.deeptrack.service;

import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static com.deeptrack.service.ReglasAlerta.Nivel.*;

class ReglasAlertaTest {
    final LocalDateTime ahora = LocalDateTime.of(2026, 11, 26, 12, 0);
    final ReglasAlerta reglas = new ReglasAlerta(true, "-10", "20", 2);
    ReglasAlerta.Nivel nivel(double v) { return reglas.evaluar("ACTIVA", v, ahora, ahora).nivel(); }

    @Test void limitesAmbosSignosYAdvertencia() {
        assertEquals(CRITICA, nivel(-10.01));
        assertEquals(ADVERTENCIA, nivel(-10));
        assertEquals(ADVERTENCIA, nivel(-8));
        assertEquals(NORMAL, nivel(-7.99));
        assertEquals(NORMAL, nivel(0));
        assertEquals(NORMAL, nivel(17.99));
        assertEquals(ADVERTENCIA, nivel(18));
        assertEquals(ADVERTENCIA, nivel(20));
        assertEquals(CRITICA, nivel(20.01));
    }

    @Test void noConfundeEstadoDatosVigenciaNiCriterio() {
        assertEquals(NO_APLICA, reglas.evaluar("RETIRADA", 99.0, ahora, ahora).nivel());
        assertEquals(SIN_DATOS, reglas.evaluar("ACTIVA", null, null, ahora).nivel());
        assertEquals(SIN_DATOS, reglas.evaluar("ACTIVA", Double.NaN, ahora, ahora).nivel());
        assertEquals(FECHA_FUTURA, reglas.evaluar("ACTIVA", 99.0, ahora.plusSeconds(1), ahora).nivel());
        assertEquals(CRITICA, reglas.evaluar("ACTIVA", 99.0, ahora.minusDays(7), ahora).nivel());
        assertEquals(SIN_CRITERIO, new ReglasAlerta(false, "", "20", 0).evaluar("ACTIVA", 99.0, ahora, ahora).nivel());
        assertEquals(SIN_CRITERIO, new ReglasAlerta(true, "", "", 0).evaluar("ACTIVA", 99.0, ahora, ahora).nivel());
        assertEquals(NORMAL, new ReglasAlerta(true, "", "20", 0).evaluar("ACTIVA", 20.0, ahora, ahora).nivel());
    }

    @Test void rechazaReglasInvalidas() {
        assertThrows(IllegalArgumentException.class, () -> new ReglasAlerta(true, "20", "10", 0));
        assertThrows(IllegalArgumentException.class, () -> new ReglasAlerta(true, "0", "10", 6));
        assertThrows(IllegalArgumentException.class, () -> new ReglasAlerta(true, "", "NaN", 0));
        assertThrows(IllegalArgumentException.class, () -> new ReglasAlerta(true, "", "20", -1));
    }
}
