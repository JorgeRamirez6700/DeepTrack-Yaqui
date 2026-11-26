package com.deeptrack.service;

import com.deeptrack.exception.ApiException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

record IntervaloAnalisis(LocalDate desde, LocalDate hasta, LocalDateTime ahora) {
    static IntervaloAnalisis validar(LocalDate desde, LocalDate hasta, LocalDateTime ahora) {
        if (desde == null || hasta == null || desde.isAfter(hasta) || hasta.isAfter(ahora.toLocalDate())
                || desde.isBefore(LocalDate.of(2000, 1, 1)) || ChronoUnit.DAYS.between(desde, hasta) >= 366) {
            throw ApiException.badRequest("Selecciona fechas válidas, sin días futuros y con un máximo de 366 días");
        }
        return new IntervaloAnalisis(desde, hasta, ahora);
    }
    LocalDateTime inicio() { return desde.atStartOfDay(); }
    LocalDateTime fin() { return hasta.plusDays(1).atStartOfDay(); }
}
