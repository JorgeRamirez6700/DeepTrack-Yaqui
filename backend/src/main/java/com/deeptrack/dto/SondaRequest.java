package com.deeptrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Cuerpo para crear o editar una sonda. */
public record SondaRequest(
        @NotBlank(message = "El ID de sonda es obligatorio") String idSonda,
        @NotBlank(message = "El cuadrante es obligatorio") String cuadrante,
        @NotNull(message = "La latitud es obligatoria") Double latitud,
        @NotNull(message = "La longitud es obligatoria") Double longitud,
        @Pattern(regexp = "ACTIVA|INACTIVA|MANTENIMIENTO", message = "Estado inválido")
        String estado,
        /** Opcional: si viene, se registra como nueva lectura. */
        Double profundidadActual
) { }
