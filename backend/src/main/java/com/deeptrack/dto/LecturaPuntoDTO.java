package com.deeptrack.dto;

import java.time.LocalDateTime;

/** Punto de la serie histórica para la gráfica de tendencia. */
public record LecturaPuntoDTO(LocalDateTime fechaHora, Double profundidadM) { }
