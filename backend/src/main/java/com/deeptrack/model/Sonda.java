package com.deeptrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Sonda instalada en un pozo.
 * NOTA: el esquema real lo define el equipo de Tecnologías. Al conectar con
 * BD_Pozos_Yaqui, ajustar nombres de tabla/columna aquí (y solo aquí).
 */
@Entity
@Table(name = "sonda")
public class Sonda {

    @Id
    @Column(name = "id_sonda", length = 20)
    private String idSonda;

    @Column(name = "cuadrante", nullable = false, length = 10)
    private String cuadrante;

    @Column(name = "latitud", nullable = false)
    private Double latitud;

    @Column(name = "longitud", nullable = false)
    private Double longitud;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "ACTIVA";

    public String getIdSonda() { return idSonda; }
    public void setIdSonda(String idSonda) { this.idSonda = idSonda; }
    public String getCuadrante() { return cuadrante; }
    public void setCuadrante(String cuadrante) { this.cuadrante = cuadrante; }
    public Double getLatitud() { return latitud; }
    public void setLatitud(Double latitud) { this.latitud = latitud; }
    public Double getLongitud() { return longitud; }
    public void setLongitud(Double longitud) { this.longitud = longitud; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
