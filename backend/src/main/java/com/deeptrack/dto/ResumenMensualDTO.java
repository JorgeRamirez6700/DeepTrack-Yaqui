package com.deeptrack.dto;

import java.util.List;

/** Datos descriptivos para reporte de mes calendario (solo sondas activas). */
public record ResumenMensualDTO(
    int anio, int mes,
    long sondasActivas, long sondasConDatos, long lecturas,
    Double profundidadMediaM,
    List<DetalleSondaDTO> sondas
) {
    public record DetalleSondaDTO(
        String idSonda, String cuadrante,
        long lecturas, Double promedioM, Double minimoM, Double maximoM
    ) { }
}
