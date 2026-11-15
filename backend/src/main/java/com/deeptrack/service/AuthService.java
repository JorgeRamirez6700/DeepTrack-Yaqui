package com.deeptrack.service;

import com.deeptrack.dto.LoginRequest;
import com.deeptrack.dto.LoginResponse;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Usuario;
import com.deeptrack.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Login básico: valida usuario/contraseña contra la BD y devuelve los datos del usuario.
     * PENDIENTE (HU-03): emitir JWT, proteger los demás endpoints y aplicar roles (RNF-03).
     */
    public LoginResponse login(LoginRequest req) {
        Usuario u = usuarioRepository.findByUsuarioLogin(req.usuario())
                .orElseThrow(() -> ApiException.unauthorized("Usuario o contraseña incorrectos"));
        if (!"ACTIVO".equals(u.getEstado()) || !passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            throw ApiException.unauthorized("Usuario o contraseña incorrectos");
        }
        return new LoginResponse(u.getUsuarioLogin(), u.getNombreCompleto(), u.getRol());
    }
}
