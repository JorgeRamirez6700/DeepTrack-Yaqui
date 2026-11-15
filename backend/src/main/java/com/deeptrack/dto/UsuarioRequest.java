package com.deeptrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UsuarioRequest(
        @NotBlank(message = "El nombre es obligatorio") String nombreCompleto,
        @NotBlank(message = "El usuario es obligatorio") String usuarioLogin,
        @NotBlank(message = "La contraseña es obligatoria") String password,
        @Pattern(regexp = "ADMINISTRADOR|ANALISTA|DIRECTOR|CONSULTA", message = "Rol inválido")
        String rol
) { }
