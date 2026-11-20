package com.deeptrack.controller;

import com.deeptrack.dto.ResumenValleDTO;
import com.deeptrack.service.EstadisticasService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticasController {
    private final EstadisticasService service;

    public EstadisticasController(EstadisticasService service) {
        this.service = service;
    }

    /** Resumen del periodo calendario actual, desde su inicio hasta hoy. */
    @GetMapping("/resumen")
    public ResumenValleDTO resumen(@RequestParam(defaultValue = "mes") String periodo) {
        return service.resumen(periodo);
    }
}
