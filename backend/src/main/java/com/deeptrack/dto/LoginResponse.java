package com.deeptrack.dto;

/** PENDIENTE: agregar token (JWT) cuando se implemente autenticación real (HU-03). */
public record LoginResponse(String usuario, String nombreCompleto, String rol) { }
