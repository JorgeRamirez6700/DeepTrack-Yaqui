package com.deeptrack.controller;

import com.deeptrack.dto.ResumenMensualDTO;
import com.deeptrack.dto.TendenciaMensualDTO;
import com.deeptrack.service.ReportesService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reportes")
public class ReportesController {
    private final ReportesService service;

    public ReportesController(ReportesService service) {
        this.service = service;
    }

    @GetMapping("/mensual")
    public ResumenMensualDTO mensual(@RequestParam int anio, @RequestParam int mes) {
        return service.reporte(anio, mes);
    }

    @GetMapping("/tendencia")
    public TendenciaMensualDTO tendencia(@RequestParam(defaultValue = "12") int meses) {
        return service.tendencia(meses);
    }
}
