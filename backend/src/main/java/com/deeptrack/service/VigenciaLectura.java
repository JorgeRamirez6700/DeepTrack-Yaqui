package com.deeptrack.service;

import java.time.LocalDateTime;

/** Vigencia de un registro, no un diagnóstico de conectividad del dispositivo. */
final class VigenciaLectura {
    private VigenciaLectura() { }

    static String evaluar(LocalDateTime fecha, LocalDateTime ahora, long horas) {
        if (fecha == null) return "SIN_DATOS";
        if (fecha.isAfter(ahora)) return "FECHA_FUTURA";
        if (horas <= 0) return "SIN_CRITERIO";
        return fecha.isBefore(ahora.minusHours(horas)) ? "ATRASADA" : "RECIENTE";
    }
}
