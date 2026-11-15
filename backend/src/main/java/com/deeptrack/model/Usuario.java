package com.deeptrack.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "nombre_completo", nullable = false, length = 120)
    private String nombreCompleto;

    @Column(name = "usuario_login", nullable = false, unique = true, length = 60)
    private String usuarioLogin;

    /** Hash BCrypt. Nunca se guarda ni se devuelve la contraseña en texto plano (RNF-02). */
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    /** ADMINISTRADOR | ANALISTA | DIRECTOR | CONSULTA */
    @Column(name = "rol", nullable = false, length = 20)
    private String rol;

    /** ACTIVO | INACTIVO */
    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "ACTIVO";

    public Long getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Long idUsuario) { this.idUsuario = idUsuario; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getUsuarioLogin() { return usuarioLogin; }
    public void setUsuarioLogin(String usuarioLogin) { this.usuarioLogin = usuarioLogin; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
