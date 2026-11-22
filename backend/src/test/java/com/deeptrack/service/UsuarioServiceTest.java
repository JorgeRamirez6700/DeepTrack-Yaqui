package com.deeptrack.service;
import com.deeptrack.dto.UsuarioUpdateRequest;
import com.deeptrack.dto.UsuarioRequest;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Usuario;
import com.deeptrack.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class UsuarioServiceTest {
    UsuarioRepository repo = mock(UsuarioRepository.class);
    PasswordEncoder encoder = mock(PasswordEncoder.class);
    UsuarioService service = new UsuarioService(repo, encoder);
    @Test void rechazaDuplicadoNormalizado() {
        when(repo.existsByUsuarioLogin("ana")).thenReturn(true);
        assertEquals(409, assertThrows(ApiException.class, () -> service.crear(
            new UsuarioRequest("Ana", " ana ", "prueba123", "CONSULTA"))).getStatus().value());
    }
    @Test void impideDesactivarCuentaPropia() {
        Usuario u = new Usuario(); u.setUsuarioLogin("admin"); u.setRol("ADMINISTRADOR");
        when(repo.findById(1L)).thenReturn(Optional.of(u));
        assertEquals(409, assertThrows(ApiException.class, () -> service.actualizar(1L,
            new UsuarioUpdateRequest("Admin", "ADMINISTRADOR", "INACTIVO"), "admin")).getStatus().value());
        verify(repo, never()).save(any());
    }
    @Test void permiteDesactivarOtraCuenta() {
        Usuario u = new Usuario(); u.setUsuarioLogin("ana"); u.setRol("CONSULTA");
        when(repo.findById(2L)).thenReturn(Optional.of(u));
        when(repo.save(u)).thenReturn(u);
        assertEquals("INACTIVO", service.actualizar(2L,
            new UsuarioUpdateRequest("Ana", "CONSULTA", "INACTIVO"), "admin").estado());
    }
}
