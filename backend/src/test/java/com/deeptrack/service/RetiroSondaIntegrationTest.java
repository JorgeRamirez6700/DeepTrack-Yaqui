package com.deeptrack.service;

import com.deeptrack.dto.SondaRequest;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Prueba de integración con JPA/H2: el retiro lógico conserva lecturas en la BD,
 * no solo objetos en memoria como los tests basados en Mockito.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:retirointegracion;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.h2.console.enabled=false"
})
@ActiveProfiles("test")
@Transactional
class RetiroSondaIntegrationTest {
    @Autowired SondaService service;
    @Autowired SondaRepository sondas;
    @Autowired LecturaRepository lecturas;
    @Autowired EntityManager entityManager;
    @Autowired ReportesService reportes;
    @Autowired EstadisticasService estadisticas;
    @Autowired AnalisisService analisis;

    @Test
    void retiroConservaLecturasEnBaseYPermiteReactivar() {
        String id = "SN-INTEGRACION-11";
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setCuadrante("A1");
        s.setLatitud(27.35);
        s.setLongitud(-109.93);
        s.setEstado("ACTIVA");
        sondas.saveAndFlush(s);
        LocalDateTime ayer = LocalDateTime.now().minusDays(1);
        lecturas.saveAndFlush(new Lectura(id, 13.5, ayer));

        YearMonth mes = YearMonth.from(ayer);
        assertTrue(reportes.reporte(mes.getYear(), mes.getMonthValue()).sondas()
            .stream().anyMatch(d -> d.idSonda().equals(id)));

        service.eliminar(id);
        entityManager.flush();
        entityManager.clear();

        assertEquals("RETIRADA", sondas.findById(id).orElseThrow().getEstado());
        assertEquals(1L, lecturas.count());
        assertEquals(1, service.historico(id, "semana").size());
        assertFalse(service.obtener(id).enAlerta());

        // Limitación documentada: los reportes agregados consideran el estado actual.
        assertFalse(reportes.reporte(mes.getYear(), mes.getMonthValue()).sondas()
            .stream().anyMatch(d -> d.idSonda().equals(id)));

        SondaRequest reactivar = new SondaRequest(id, "A1", 27.35, -109.93, "ACTIVA", null);
        service.actualizar(id, reactivar);
        entityManager.flush();
        entityManager.clear();

        assertEquals("ACTIVA", sondas.findById(id).orElseThrow().getEstado());
        assertEquals(1L, lecturas.count());
        assertEquals(13.5, service.obtener(id).profundidadActual());
        assertEquals(13.5, service.listar().stream()
            .filter(d -> d.idSonda().equals(id)).findFirst().orElseThrow().profundidadActual());
        assertTrue(reportes.reporte(mes.getYear(), mes.getMonthValue()).sondas()
            .stream().anyMatch(d -> d.idSonda().equals(id)));
    }
    @Test
    void ultimaLecturaCoincideEntreListadoDetalleYEdicionConFechaEmpatada() {
        String id = "QA-EMPATE";
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setCuadrante("QA");
        s.setLatitud(27.35);
        s.setLongitud(-109.93);
        sondas.saveAndFlush(s);
        LocalDateTime fecha = LocalDateTime.now().minusHours(1).withNano(0);
        lecturas.saveAndFlush(new Lectura(id, 8.0, fecha));
        lecturas.saveAndFlush(new Lectura(id, -4.0, fecha));
        entityManager.clear();

        assertEquals(-4.0, service.obtener(id).profundidadActual());
        assertEquals(fecha, service.obtener(id).ultimaLecturaFechaHora());
        assertEquals(fecha, service.listar().stream().filter(d -> d.idSonda().equals(id))
            .findFirst().orElseThrow().ultimaLecturaFechaHora());
        assertEquals(-4.0, service.listar().stream()
            .filter(d -> d.idSonda().equals(id)).findFirst().orElseThrow().profundidadActual());
        assertEquals(-4.0, service.actualizar(id,
            new SondaRequest(id, "QA", 27.35, -109.93, "ACTIVA", -4.0)).profundidadActual());
        entityManager.flush();
        assertEquals(2L, lecturas.count());
    }
    @Test
    void historicoExcluyeLecturasFuturasYOrdenaEmpates() {
        String id = "QA-FECHAS";
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setCuadrante("QA");
        s.setLatitud(27.35);
        s.setLongitud(-109.93);
        sondas.saveAndFlush(s);
        LocalDateTime fecha = LocalDateTime.now().minusHours(1).withNano(0);
        lecturas.saveAndFlush(new Lectura(id, 1.0, fecha));
        lecturas.saveAndFlush(new Lectura(id, 2.0, fecha));
        lecturas.saveAndFlush(new Lectura(id, 99.0, fecha.plusDays(2)));
        entityManager.clear();
        assertEquals(java.util.List.of(1.0, 2.0), service.historico(id, "dia").stream()
            .map(p -> p.profundidadM()).toList());
        assertEquals("FECHA_FUTURA", service.obtener(id).vigenciaLectura());
    }
    @Test
    void analisisPorCuadranteYComparacionExcluyenFuturoYConservanAusencia() {
        LocalDateTime ahora = LocalDateTime.now();
        var hoy = ahora.toLocalDate();
        for (String id : java.util.List.of("QA-A", "QA-B", "QA-C", "QA-D")) {
            Sonda s = new Sonda();
            s.setIdSonda(id); s.setCuadrante("QA"); s.setLatitud(27.3); s.setLongitud(-109.9);
            if (id.equals("QA-D")) s.setEstado("RETIRADA");
            sondas.saveAndFlush(s);
        }
        var ayer = hoy.minusDays(1).atStartOfDay();
        lecturas.saveAndFlush(new Lectura("QA-A", 10.0, ayer));
        lecturas.saveAndFlush(new Lectura("QA-A", 10.0, ayer.plusMinutes(1)));
        lecturas.saveAndFlush(new Lectura("QA-B", -2.0, ayer));
        lecturas.saveAndFlush(new Lectura("QA-D", 100.0, ayer));
        lecturas.saveAndFlush(new Lectura("QA-A", 99.0, ahora.plusSeconds(30)));
        var r = analisis.consultar(hoy.minusDays(1), hoy, java.util.List.of("QA-A", "QA-D"));
        assertEquals(2, r.series().size());
        assertEquals(10.0, r.series().get(0).dias().get(0).promedioM());
        assertNull(r.series().get(0).dias().get(1).promedioM());
        assertEquals(100.0, r.series().get(1).dias().get(0).promedioM());
        var q = r.cuadrantes().get(0);
        assertEquals(3, q.sondasActivas()); assertEquals(2, q.sondasConDatos());
        assertEquals(3, q.lecturas()); assertEquals(4.0, q.promedioM());
        assertEquals(2, service.historicoIntervalo("QA-A", hoy.minusDays(1), hoy).size());
        assertEquals(2, service.historicoIntervalo("QA-A", hoy.minusDays(1), hoy.minusDays(1)).size());
        assertThrows(com.deeptrack.exception.ApiException.class,
                () -> analisis.consultar(hoy, hoy.plusDays(1), java.util.List.of()));
    }

    @Test
    void agregadosNoIncluyenLecturasFuturasEnPeriodoActual() {
        var ahora = LocalDateTime.now();
        Sonda s = new Sonda();
        s.setIdSonda("QA-FUTURO"); s.setCuadrante("QA"); s.setLatitud(27.3); s.setLongitud(-109.9);
        sondas.saveAndFlush(s);
        lecturas.saveAndFlush(new Lectura("QA-FUTURO", 10.0, ahora.toLocalDate().atStartOfDay()));
        lecturas.saveAndFlush(new Lectura("QA-FUTURO", 30.0, ahora.plusMinutes(1)));
        assertEquals(10.0, estadisticas.resumen("dia").profundidadMediaM());
        assertEquals(1, estadisticas.resumen("dia").lecturas());
        var mes = YearMonth.from(ahora);
        assertEquals(10.0, reportes.reporte(mes.getYear(), mes.getMonthValue()).profundidadMediaM());
        assertEquals(10.0, reportes.tendencia(2).meses().get(1).profundidadMediaM());
    }
}
