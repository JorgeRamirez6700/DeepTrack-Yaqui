package com.deeptrack.dto;

import java.time.LocalDate;
import java.util.List;

public record AnalisisDTO(LocalDate desde, LocalDate hasta, List<Serie> series, List<Cuadrante> cuadrantes) {
    public record Dia(LocalDate fecha, Double promedioM, long lecturas) { }
    public record Serie(String idSonda, String cuadrante, String estado, List<Dia> dias) { }
    public record Cuadrante(String cuadrante, long sondasActivas, long sondasConDatos,
                            long lecturas, Double promedioM) { }
}
