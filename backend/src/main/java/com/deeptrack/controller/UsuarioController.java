package com.deeptrack.controller;

import com.deeptrack.dto.UsuarioDTO;
import com.deeptrack.dto.UsuarioRequest;
import com.deeptrack.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** PENDIENTE: restringir a rol ADMINISTRADOR cuando exista autenticación real (RNF-03). */
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
}
