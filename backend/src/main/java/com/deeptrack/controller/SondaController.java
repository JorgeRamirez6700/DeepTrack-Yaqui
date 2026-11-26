package com.deeptrack.controller;

import com.deeptrack.dto.LecturaPuntoDTO;
import com.deeptrack.dto.SondaDTO;
import com.deeptrack.dto.SondaRequest;
import com.deeptrack.service.SondaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;

@RestController
@RequestMapping("/api/sondas")
public class SondaController {

    private final SondaService sondaService;

    public SondaController(SondaService sondaService) {
        this.sondaService = sondaService;
    }

    @GetMapping
    public List<SondaDTO> listar() {
        return sondaService.listar();
    }

    @GetMapping("/{id}")
    public SondaDTO obtener(@PathVariable String id) {
        return sondaService.obtener(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SondaDTO crear(@Valid @RequestBody SondaRequest req) {
        return sondaService.crear(req);
    }

    @PutMapping("/{id}")
    public SondaDTO actualizar(@PathVariable String id, @Valid @RequestBody SondaRequest req) {
        return sondaService.actualizar(id, req);
    }

    /** Retiro lógico (204); no se borra el histórico. Reactivar mediante PUT estado ACTIVA. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable String id) {
        sondaService.eliminar(id);
    }

    @GetMapping("/{id}/historico/intervalo")
    public List<LecturaPuntoDTO> historicoIntervalo(@PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return sondaService.historicoIntervalo(id, desde, hasta);
    }

    /** GET /api/sondas/{id}/historico?rango=dia|semana|mes|6meses|anio */
    @GetMapping("/{id}/historico")
    public List<LecturaPuntoDTO> historico(@PathVariable String id,
                                           @RequestParam(defaultValue = "mes") String rango) {
        return sondaService.historico(id, rango);
    }
}
