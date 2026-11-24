package com.deeptrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/** Cuerpo para crear o editar una sonda. */
public record SondaRequest(
        @NotBlank(message = "El ID de sonda es obligatorio") @Size(max = 20) String idSonda,
        @NotBlank(message = "El cuadrante es obligatorio") @Size(max = 10) String cuadrante,
        @NotNull(message = "La latitud es obligatoria") @DecimalMin("-90.0") @DecimalMax("90.0") Double latitud,
        @NotNull(message = "La longitud es obligatoria") @DecimalMin("-180.0") @DecimalMax("180.0") Double longitud,
        @Pattern(regexp = "ACTIVA|INACTIVA|MANTENIMIENTO|RETIRADA", message = "Estado inválido")
        String estado,
        /** Opcional: si viene, se registra como nueva lectura. */
        // Valor firmado respecto a la referencia de medición; negativo permitido.
        Double profundidadActual
) { }
