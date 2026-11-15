package com.deeptrack.seed;

import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.model.Usuario;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import com.deeptrack.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Datos de ejemplo SOLO para el perfil "dev" (H2 persistente).
 * No se ejecuta con el perfil "prod", así que jamás escribe en la BD de TI.
 */
@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private final SondaRepository sondaRepository;
    private final LecturaRepository lecturaRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(SondaRepository sondaRepository, LecturaRepository lecturaRepository,
                         UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.sondaRepository = sondaRepository;
        this.lecturaRepository = lecturaRepository;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            usuarioRepository.save(usuario("Administrador de Pruebas", "admin", "admin123", "ADMINISTRADOR"));
            usuarioRepository.save(usuario("Analista de Pruebas", "analista", "analista123", "ANALISTA"));
        }
        // No recrear ni sobrescribir sondas editadas por el usuario al reiniciar.
        // Solo se generan datos de muestra cuando la tabla de sondas está vacía.
        if (sondaRepository.count() == 0) {
            //            id          cuadr lat     lng        profundidad base (m)
            crearSonda("SN-YQ-012", "A1", 27.42, -109.93, 9.8);
            crearSonda("SN-YQ-045", "B3", 27.35, -110.02, 24.6);
            crearSonda("SN-YQ-078", "B1", 27.30, -109.88, 11.2);
            crearSonda("SN-YQ-091", "C4", 27.25, -109.97, 14.5);
            crearSonda("SN-YQ-103", "C2", 27.20, -109.85, 10.1);
        }
    }

    private Usuario usuario(String nombre, String login, String password, String rol) {
        Usuario u = new Usuario();
        u.setNombreCompleto(nombre);
        u.setUsuarioLogin(login);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setRol(rol);
        u.setEstado("ACTIVO");
        return u;
    }

    /**
     * Crea una sonda y datos FICTICIOS para probar escalas diarias, semanales,
     * mensuales y anuales: un registro por día durante 365 días y, durante el
     * último día, registros cada 4 horas. Nunca representa telemetría real.
     * Se ejecuta únicamente en la primera inicialización de una BD vacía.
     */
    private void crearSonda(String id, String cuadrante, double lat, double lng, double profundidadActual) {
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setCuadrante(cuadrante);
        s.setLatitud(lat);
        s.setLongitud(lng);
        s.setEstado("ACTIVA");
        sondaRepository.save(s);

        List<Lectura> lecturas = new ArrayList<>();
        LocalDateTime ahora = LocalDateTime.now();
        for (int dia = 365; dia >= 1; dia--) {
            // Fórmula determinista: permite ver tendencias sin cambios aleatorios.
            double prof = profundidadActual + Math.sin(dia * 0.09) * 1.3 - dia * 0.003;
            prof = Math.round(Math.max(prof, 0.5) * 100.0) / 100.0;
            lecturas.add(new Lectura(id, prof, ahora.minusDays(dia)));
        }
        for (int horas = 20; horas >= 4; horas -= 4) {
            double prof = profundidadActual + Math.sin(horas * 0.2) * 0.18;
            prof = Math.round(Math.max(prof, 0.5) * 100.0) / 100.0;
            lecturas.add(new Lectura(id, prof, ahora.minusHours(horas)));
        }
        lecturas.add(new Lectura(id, profundidadActual, ahora));
        lecturaRepository.saveAll(lecturas);
    }
}
