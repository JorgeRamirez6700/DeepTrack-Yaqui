package com.deeptrack.service;

import com.deeptrack.dto.UsuarioDTO;
import com.deeptrack.dto.UsuarioUpdateRequest;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
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
    @Transactional
    public UsuarioDTO crear(UsuarioRequest req) {
        String login = req.usuarioLogin().trim();
        if (req.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw ApiException.badRequest("La contraseña supera 72 bytes UTF-8");
        if (usuarioRepository.existsByUsuarioLogin(login)) {
            throw ApiException.conflict("Ya existe el usuario " + req.usuarioLogin());
        }
        Usuario u = new Usuario();
        u.setNombreCompleto(req.nombreCompleto().trim());
        u.setUsuarioLogin(login);
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setRol(req.rol() == null ? "CONSULTA" : req.rol());
        u.setEstado("ACTIVO");
        return toDto(usuarioRepository.save(u));
    }

    @Transactional
    public UsuarioDTO actualizar(Long id, UsuarioUpdateRequest req, String actor) {
        Usuario u = usuarioRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Usuario no encontrado"));
        if (u.getUsuarioLogin().equals(actor)
                && (!"ADMINISTRADOR".equals(req.rol()) || !"ACTIVO".equals(req.estado()))) {
            throw ApiException.conflict("No puedes desactivar tu cuenta ni retirar tu propio rol de administrador");
        }
        u.setNombreCompleto(req.nombreCompleto().trim());
        u.setRol(req.rol());
        u.setEstado(req.estado());
        return toDto(usuarioRepository.save(u));
    }

    private UsuarioDTO toDto(Usuario u) {
        return new UsuarioDTO(u.getIdUsuario(), u.getNombreCompleto(), u.getUsuarioLogin(), u.getRol(), u.getEstado());
    }
}
