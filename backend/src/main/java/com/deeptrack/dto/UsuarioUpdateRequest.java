package com.deeptrack.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UsuarioUpdateRequest(
    @NotBlank @Size(max=120) String nombreCompleto,
    @NotBlank @Pattern(regexp="ADMINISTRADOR|ANALISTA|DIRECTOR|CONSULTA") String rol,
    @NotBlank @Pattern(regexp="ACTIVO|INACTIVO") String estado
) {}
