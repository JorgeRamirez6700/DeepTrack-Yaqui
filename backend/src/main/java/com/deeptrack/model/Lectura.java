package com.deeptrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/** Lectura de telemetría (profundidad en metros) emitida por una sonda. */
@Entity
@Table(name = "lectura", indexes = @Index(name = "idx_lectura_sonda_fecha", columnList = "id_sonda, fecha_hora"))
public class Lectura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_lectura")
    private Long idLectura;

    @Column(name = "id_sonda", nullable = false, length = 20)
    private String idSonda;

    @Column(name = "profundidad_m", nullable = false)
    private Double profundidadM;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    public Lectura() { }

    public Lectura(String idSonda, Double profundidadM, LocalDateTime fechaHora) {
        this.idSonda = idSonda;
        this.profundidadM = profundidadM;
        this.fechaHora = fechaHora;
    }

    public Long getIdLectura() { return idLectura; }
    public void setIdLectura(Long idLectura) { this.idLectura = idLectura; }
    public String getIdSonda() { return idSonda; }
    public void setIdSonda(String idSonda) { this.idSonda = idSonda; }
    public Double getProfundidadM() { return profundidadM; }
    public void setProfundidadM(Double profundidadM) { this.profundidadM = profundidadM; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
}
