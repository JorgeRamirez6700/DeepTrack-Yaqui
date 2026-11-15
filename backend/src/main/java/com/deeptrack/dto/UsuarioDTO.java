package com.deeptrack.dto;

/** Representación pública de un usuario: nunca incluye el hash de contraseña. */
public record UsuarioDTO(Long idUsuario, String nombreCompleto, String usuarioLogin, String rol, String estado) { }
