package com.deeptrack.controller;

import com.deeptrack.dto.AnalisisDTO;
import com.deeptrack.service.AnalisisService;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/estadisticas/analisis")
public class AnalisisController {
    private final AnalisisService service;
    public AnalisisController(AnalisisService service) { this.service = service; }

    @GetMapping
    public AnalisisDTO consultar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(name = "ids", required = false) List<String> ids) {
        return service.consultar(desde, hasta, ids);
    }
}
