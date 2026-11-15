package com.deeptrack.repository;

import com.deeptrack.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByUsuarioLogin(String usuarioLogin);
    boolean existsByUsuarioLogin(String usuarioLogin);
}
