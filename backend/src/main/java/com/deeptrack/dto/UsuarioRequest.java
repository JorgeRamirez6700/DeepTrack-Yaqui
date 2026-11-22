package com.deeptrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioRequest(
        @NotBlank(message = "El nombre es obligatorio") @Size(max=120) String nombreCompleto,
        @NotBlank(message = "El usuario es obligatorio") @Size(max=60) String usuarioLogin,
        @NotBlank(message = "La contraseña es obligatoria") @Size(min=8,max=72) String password,
        @Pattern(regexp = "ADMINISTRADOR|ANALISTA|DIRECTOR|CONSULTA", message = "Rol inválido")
        String rol
) { }
