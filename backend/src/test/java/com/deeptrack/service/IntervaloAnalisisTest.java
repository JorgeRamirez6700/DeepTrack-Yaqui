package com.deeptrack.service;
import com.deeptrack.exception.ApiException;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class IntervaloAnalisisTest {
    @Test void limitesCalendario() {
        var ahora = LocalDateTime.of(2026, 11, 26, 12, 0);
        var hoy = ahora.toLocalDate();
        var i = IntervaloAnalisis.validar(hoy.minusDays(365), hoy, ahora);
        assertEquals(hoy.plusDays(1).atStartOfDay(), i.fin());
        assertEquals(ahora, i.ahora());
        assertThrows(ApiException.class, () -> IntervaloAnalisis.validar(hoy.minusDays(366), hoy, ahora));
        assertThrows(ApiException.class, () -> IntervaloAnalisis.validar(hoy.plusDays(1), hoy, ahora));
        assertThrows(ApiException.class, () -> IntervaloAnalisis.validar(hoy, hoy.plusDays(1), ahora));
    }
}
