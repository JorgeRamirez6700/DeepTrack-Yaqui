package com.deeptrack.service;

import com.deeptrack.dto.UsuarioDTO;
import com.deeptrack.dto.UsuarioRequest;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Usuario;
import com.deeptrack.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<UsuarioDTO> listar() {
        return usuarioRepository.findAll().stream().map(this::toDto).toList();
    }

    /** HU-13 / RF-07: alta de usuario (la contraseña se guarda con hash BCrypt). */
    public UsuarioDTO crear(UsuarioRequest req) {
        if (usuarioRepository.existsByUsuarioLogin(req.usuarioLogin())) {
            throw ApiException.conflict("Ya existe el usuario " + req.usuarioLogin());
        }
        Usuario u = new Usuario();
        u.setNombreCompleto(req.nombreCompleto().trim());
        u.setUsuarioLogin(req.usuarioLogin().trim());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setRol(req.rol() == null ? "CONSULTA" : req.rol());
        u.setEstado("ACTIVO");
        return toDto(usuarioRepository.save(u));
    }

    private UsuarioDTO toDto(Usuario u) {
        return new UsuarioDTO(u.getIdUsuario(), u.getNombreCompleto(), u.getUsuarioLogin(), u.getRol(), u.getEstado());
    }
}
