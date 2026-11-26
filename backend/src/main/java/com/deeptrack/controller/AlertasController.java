package com.deeptrack.controller;

import com.deeptrack.service.ReglasAlerta;
import com.deeptrack.service.SondaService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/alertas")
public class AlertasController {
    private final ReglasAlerta reglas;
    private final SondaService sondas;
    public AlertasController(ReglasAlerta reglas, SondaService sondas) {
        this.reglas = reglas; this.sondas = sondas;
    }

    @GetMapping("/criterios")
    public ReglasAlerta.Criterios criterios() { return reglas.criterios(); }

    public record Punto(LocalDateTime fechaHora, Double profundidadM, String nivel, String motivo) { }
    public record Historial(String idSonda, long coincidencias, List<Punto> puntos) { }

    /** Último mes móvil, reevaluado con límites actuales; no es bitácora de eventos. */
    @GetMapping("/{id}/historial")
    public Historial historial(@PathVariable String id) {
        LocalDateTime ahora = LocalDateTime.now();
        var coincidencias = sondas.historico(id, "mes").stream()
                .map(p -> {
                    var e = reglas.evaluar("ACTIVA", p.profundidadM(), p.fechaHora(), ahora);
                    return new Punto(p.fechaHora(), p.profundidadM(), e.nivel().name(), e.motivo());
                })
                .filter(p -> "CRITICA".equals(p.nivel()) || "ADVERTENCIA".equals(p.nivel()))
                .toList();
        var ultimas = new java.util.ArrayList<>(coincidencias.subList(Math.max(0, coincidencias.size()-100), coincidencias.size()));
        java.util.Collections.reverse(ultimas);
        return new Historial(id, coincidencias.size(), List.copyOf(ultimas));
    }
}
