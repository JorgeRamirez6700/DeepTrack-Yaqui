package com.deeptrack.dto;

import java.time.LocalDate;

/**
 * Indicadores descriptivos de las sondas activas con lecturas en un periodo.
 * La media del valle es la media de las medias por sonda (no un nivel freático regional).
 */
public record ResumenValleDTO(
        String periodo,
        LocalDate desde,
        LocalDate hasta,
        long sondasActivas,
        long sondasConDatos,
        long lecturas,
        Double profundidadMediaM,
        Double minimaMediaPorSondaM,
        Double maximaMediaPorSondaM
) { }
