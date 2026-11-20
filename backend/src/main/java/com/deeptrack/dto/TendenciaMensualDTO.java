package com.deeptrack.dto;

import java.util.List;

public record TendenciaMensualDTO(List<PuntoMensualDTO> meses) {
    public record PuntoMensualDTO(
        String mes, long sondasConDatos, long lecturas, Double profundidadMediaM
    ) { }
}
