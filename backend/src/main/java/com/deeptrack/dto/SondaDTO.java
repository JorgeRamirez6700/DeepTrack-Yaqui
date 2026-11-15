package com.deeptrack.dto;

/** Sonda con su última lectura y bandera de alerta (para mapa y lista). */
public record SondaDTO(
        String idSonda,
        String cuadrante,
        Double latitud,
        Double longitud,
        String estado,
        Double profundidadActual,
        boolean enAlerta
) { }
