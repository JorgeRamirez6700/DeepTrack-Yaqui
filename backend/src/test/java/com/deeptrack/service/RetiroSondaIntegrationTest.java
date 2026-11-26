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
        assertEquals(-4.0, service.listar().stream()
            .filter(d -> d.idSonda().equals(id)).findFirst().orElseThrow().profundidadActual());
        assertEquals(-4.0, service.actualizar(id,
            new SondaRequest(id, "QA", 27.35, -109.93, "ACTIVA", -4.0)).profundidadActual());
        entityManager.flush();
        assertEquals(2L, lecturas.count());
    }
}
