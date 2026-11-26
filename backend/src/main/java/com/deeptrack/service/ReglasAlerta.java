package com.deeptrack.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

/** Clasifica mediciones, no diagnostica la seguridad del acuífero ni conectividad. */
@Component
public final class ReglasAlerta {
    public enum Nivel { NORMAL, ADVERTENCIA, CRITICA, SIN_DATOS, NO_APLICA, SIN_CRITERIO, FECHA_FUTURA }
    public record Evaluacion(Nivel nivel, String motivo) { }
    public record Criterios(boolean habilitada, Double inferiorM, Double superiorM, double margenM) { }

    private final Criterios criterios;

    public ReglasAlerta(@Value("${deeptrack.alerta.habilitada:true}") boolean habilitada,
                        @Value("${deeptrack.alerta.inferior-metros:}") String inferior,
                        @Value("${deeptrack.alerta.umbral-metros:20}") String superior,
                        @Value("${deeptrack.alerta.margen-metros:0}") double margen) {
        Double bajo = limite(inferior), alto = limite(superior);
        if (!Double.isFinite(margen) || margen < 0 ||
                (bajo != null && alto != null && (bajo >= alto || margen > (alto - bajo) / 2))) {
            throw new IllegalArgumentException("Configuración de alertas inválida");
        }
        criterios = new Criterios(habilitada && (bajo != null || alto != null), bajo, alto, margen);
    }

    private static Double limite(String valor) {
        if (valor == null || valor.isBlank()) return null;
        double n = Double.parseDouble(valor.trim());
        if (!Double.isFinite(n)) throw new IllegalArgumentException("Límite de alerta no finito");
        return n;
    }

    public Criterios criterios() { return criterios; }

    public Evaluacion evaluar(String estado, Double valor, LocalDateTime fecha, LocalDateTime ahora) {
        if (!"ACTIVA".equals(estado)) return new Evaluacion(Nivel.NO_APLICA, "Sonda no activa");
        if (valor == null || !Double.isFinite(valor) || fecha == null)
            return new Evaluacion(Nivel.SIN_DATOS, "Sin medición válida");
        if (fecha.isAfter(ahora)) return new Evaluacion(Nivel.FECHA_FUTURA, "Fecha posterior a la consulta");
        if (!criterios.habilitada()) return new Evaluacion(Nivel.SIN_CRITERIO, "Sin límites habilitados");
        Double bajo = criterios.inferiorM(), alto = criterios.superiorM();
        double margen = criterios.margenM();
        if (bajo != null && valor < bajo) return new Evaluacion(Nivel.CRITICA, "Por debajo del límite inferior");
        if (alto != null && valor > alto) return new Evaluacion(Nivel.CRITICA, "Por encima del límite superior");
        if (margen > 0 && bajo != null && valor - bajo <= margen)
            return new Evaluacion(Nivel.ADVERTENCIA, "Próxima al límite inferior");
        if (margen > 0 && alto != null && alto - valor <= margen)
            return new Evaluacion(Nivel.ADVERTENCIA, "Próxima al límite superior");
        return new Evaluacion(Nivel.NORMAL, "Dentro de los límites configurados");
    }
}
