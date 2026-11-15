package com.deeptrack.service;

import com.deeptrack.dto.LoginRequest;
import com.deeptrack.dto.LoginResponse;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Usuario;
import com.deeptrack.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UsuarioRepository usuarios;
    @Mock PasswordEncoder encoder;
    private AuthService auth;

    @BeforeEach
    void setUp() {
        auth = new AuthService(usuarios, encoder);
    }

    private Usuario usuario(String estado) {
        Usuario u = new Usuario();
        u.setUsuarioLogin("analista");
        u.setNombreCompleto("Analista de Pruebas");
        u.setPasswordHash("hash-de-prueba");
        u.setRol("ANALISTA");
        u.setEstado(estado);
        return u;
    }

    @Test
    void permiteCredencialesValidasDeUsuarioActivo() {
        when(usuarios.findByUsuarioLogin("analista")).thenReturn(Optional.of(usuario("ACTIVO")));
        when(encoder.matches("correcta", "hash-de-prueba")).thenReturn(true);

        LoginResponse respuesta = auth.login(new LoginRequest("analista", "correcta"));

        assertEquals("analista", respuesta.usuario());
        assertEquals("ANALISTA", respuesta.rol());
        assertEquals("Analista de Pruebas", respuesta.nombreCompleto());
    }

    @Test
    void rechazaContrasenaIncorrecta() {
        when(usuarios.findByUsuarioLogin("analista")).thenReturn(Optional.of(usuario("ACTIVO")));
        when(encoder.matches("incorrecta", "hash-de-prueba")).thenReturn(false);

        ApiException ex = assertThrows(ApiException.class,
                () -> auth.login(new LoginRequest("analista", "incorrecta")));
        assertEquals(401, ex.getStatus().value());
    }

    @Test
    void rechazaUsuarioInactivo() {
        when(usuarios.findByUsuarioLogin("analista")).thenReturn(Optional.of(usuario("INACTIVO")));

        ApiException ex = assertThrows(ApiException.class,
                () -> auth.login(new LoginRequest("analista", "correcta")));
        assertEquals(401, ex.getStatus().value());
        verifyNoInteractions(encoder);
    }

    @Test
    void rechazaUsuarioInexistente() {
        when(usuarios.findByUsuarioLogin("desconocido")).thenReturn(Optional.empty());

        ApiException ex = assertThrows(ApiException.class,
                () -> auth.login(new LoginRequest("desconocido", "cualquiera")));
        assertEquals(401, ex.getStatus().value());
        verifyNoInteractions(encoder);
    }
}
