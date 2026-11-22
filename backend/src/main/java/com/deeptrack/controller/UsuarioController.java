package com.deeptrack.controller;

import com.deeptrack.dto.UsuarioDTO;
import com.deeptrack.dto.UsuarioUpdateRequest;
import com.deeptrack.dto.LoginResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.deeptrack.dto.UsuarioRequest;
import com.deeptrack.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Gestión de cuentas: acceso restringido por Spring Security a ADMINISTRADOR. */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<UsuarioDTO> listar() {
        return usuarioService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioDTO crear(@Valid @RequestBody UsuarioRequest req) {
        return usuarioService.crear(req);
    }
    @PutMapping("/{id}")
    public UsuarioDTO actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest req,
                                  @AuthenticationPrincipal LoginResponse actor) {
        return usuarioService.actualizar(id, req, actor.usuario());
    }
}
