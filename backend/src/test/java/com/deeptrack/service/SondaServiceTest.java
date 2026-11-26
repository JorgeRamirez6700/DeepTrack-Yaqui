package com.deeptrack.service;

import com.deeptrack.dto.SondaDTO;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.any;

/** Cubre CP-05 (alerta visual) y la validación de rango de RF-05 del Plan de Pruebas. */
@ExtendWith(MockitoExtension.class)
class SondaServiceTest {

    @Mock SondaRepository sondaRepository;
    @Mock LecturaRepository lecturaRepository;

    SondaService service;

    @BeforeEach
    void setUp() {
        service = new SondaService(sondaRepository, lecturaRepository, new ReglasAlerta(true, "", "20", 0), 48);
    }

    private Sonda sonda(String id) {
        Sonda s = new Sonda();
        s.setIdSonda(id);
        s.setCuadrante("B3");
        s.setLatitud(27.35);
        s.setLongitud(-110.02);
        s.setEstado("ACTIVA");
        return s;
    }

    @Test
    void marcaAlertaCuandoLaProfundidadSuperaElUmbral() {
        when(sondaRepository.findAll()).thenReturn(List.of(sonda("SN-1")));
        when(lecturaRepository.findUltimasPorSonda(any())).thenReturn(List.of(new Lectura("SN-1", 24.6, LocalDateTime.now())));

        SondaDTO dto = service.listar().get(0);

        assertEquals(24.6, dto.profundidadActual());
        assertTrue(dto.enAlerta());
    }

    @Test
    void noMarcaAlertaCuandoLaProfundidadEstaBajoElUmbral() {
        when(sondaRepository.findAll()).thenReturn(List.of(sonda("SN-2")));
        when(lecturaRepository.findUltimasPorSonda(any())).thenReturn(List.of(new Lectura("SN-2", 11.2, LocalDateTime.now())));

        assertFalse(service.listar().get(0).enAlerta());
    }

    @Test
    void historicoRechazaUnRangoInvalido() {
        when(sondaRepository.findById("SN-3")).thenReturn(Optional.of(sonda("SN-3")));

        ApiException ex = assertThrows(ApiException.class, () -> service.historico("SN-3", "decada"));
        assertEquals(400, ex.getStatus().value());
    }
    @Test
    void historicoAceptaRangoDia() {
        when(sondaRepository.findById("SN-3")).thenReturn(Optional.of(sonda("SN-3")));
        when(lecturaRepository.findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(eq("SN-3"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        LocalDateTime antes = LocalDateTime.now().minusDays(1);
        assertTrue(service.historico("SN-3", "dia").isEmpty());
        LocalDateTime despues = LocalDateTime.now().minusDays(1);
        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(lecturaRepository).findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(eq("SN-3"), captor.capture(), any(LocalDateTime.class));
        assertFalse(captor.getValue().isBefore(antes));
        assertFalse(captor.getValue().isAfter(despues));
    }

    @Test
    void historicoAceptaRangoSemana() {
        when(sondaRepository.findById("SN-3")).thenReturn(Optional.of(sonda("SN-3")));
        when(lecturaRepository.findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(eq("SN-3"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of());

        LocalDateTime antes = LocalDateTime.now().minusWeeks(1);
        assertTrue(service.historico("SN-3", "semana").isEmpty());
        LocalDateTime despues = LocalDateTime.now().minusWeeks(1);
        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(lecturaRepository).findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(eq("SN-3"), captor.capture(), any(LocalDateTime.class));
        assertFalse(captor.getValue().isBefore(antes));
        assertFalse(captor.getValue().isAfter(despues));
    }

    @Test
    void crearNormalizaIdAntesDeComprobarDuplicado() {
        when(sondaRepository.existsById("SN-1")).thenReturn(true);
        com.deeptrack.dto.SondaRequest req = new com.deeptrack.dto.SondaRequest(
                "  SN-1  ", "A1", 27.4, -109.9, "ACTIVA", null);
        ApiException ex = assertThrows(ApiException.class, () -> service.crear(req));
        assertEquals(409, ex.getStatus().value());
        verify(sondaRepository).existsById("SN-1");
        verify(sondaRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void retiroLogicoPreservaLecturasYRegistro() {
        Sonda s = sonda("SN-RET");
        when(sondaRepository.findById("SN-RET")).thenReturn(Optional.of(s));
        service.eliminar("SN-RET");
        assertEquals("RETIRADA", s.getEstado());
        verify(sondaRepository).save(s);
        org.mockito.Mockito.verifyNoInteractions(lecturaRepository);
        org.mockito.Mockito.verify(sondaRepository, org.mockito.Mockito.never()).deleteById(any());
    }

    @Test
    void noPermiteRetirarDosVeces() {
        Sonda s = sonda("SN-RET");
        s.setEstado("RETIRADA");
        when(sondaRepository.findById("SN-RET")).thenReturn(Optional.of(s));
        assertEquals(409, assertThrows(ApiException.class,
            () -> service.eliminar("SN-RET")).getStatus().value());
        org.mockito.Mockito.verify(sondaRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void historicoSigueDisponibleTrasRetiro() {
        Sonda s = sonda("SN-RET");
        s.setEstado("RETIRADA");
        when(sondaRepository.findById("SN-RET")).thenReturn(Optional.of(s));
        when(lecturaRepository.findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(eq("SN-RET"), any(LocalDateTime.class), any(LocalDateTime.class)))
            .thenReturn(List.of(new Lectura("SN-RET", 13.5, LocalDateTime.now().minusDays(1))));
        assertEquals(1, service.historico("SN-RET", "mes").size());
    }

    @Test
    void sondaRetiradaNoGeneraAlertaActual() {
        Sonda s = sonda("SN-RET");
        s.setEstado("RETIRADA");
        when(sondaRepository.findAll()).thenReturn(List.of(s));
        when(lecturaRepository.findUltimasPorSonda(any())).thenReturn(List.of(new Lectura("SN-RET", 30.0, LocalDateTime.now().minusDays(2))));
        assertFalse(service.listar().get(0).enAlerta());
    }

    @Test
    void noRegistraNuevaLecturaEnSondaRetirada() {
        Sonda s = sonda("SN-RET");
        s.setEstado("RETIRADA");
        when(sondaRepository.findById("SN-RET")).thenReturn(Optional.of(s));
        var req = new com.deeptrack.dto.SondaRequest("SN-RET", "B3", 27.35, -110.02, "RETIRADA", 18.0);
        assertEquals(400, assertThrows(ApiException.class,
            () -> service.actualizar("SN-RET", req)).getStatus().value());
        org.mockito.Mockito.verify(lecturaRepository, org.mockito.Mockito.never()).save(any());
    }

    @Test
    void reactivacionNoEliminaHistorial() {
        Sonda s = sonda("SN-RET");
        s.setEstado("RETIRADA");
        when(sondaRepository.findById("SN-RET")).thenReturn(Optional.of(s));
        when(lecturaRepository.findFirstByIdSondaOrderByFechaHoraDescIdLecturaDesc("SN-RET"))
            .thenReturn(Optional.of(new Lectura("SN-RET", 12.0, LocalDateTime.now().minusDays(2))));
        var req = new com.deeptrack.dto.SondaRequest("SN-RET", "B3", 27.35, -110.02, "ACTIVA", null);
        assertEquals("ACTIVA", service.actualizar("SN-RET", req).estado());
        org.mockito.Mockito.verify(lecturaRepository, org.mockito.Mockito.never()).deleteById(any());
    }

    @Test
    void listadoVacioNoConsultaLecturas() {
        when(sondaRepository.findAll()).thenReturn(List.of());
        assertTrue(service.listar().isEmpty());
        org.mockito.Mockito.verify(lecturaRepository, org.mockito.Mockito.never()).findUltimasPorSonda(any());
    }

    @Test
    void obtieneUltimasEnUnSoloLote() {
        when(sondaRepository.findAll()).thenReturn(List.of(sonda("A"), sonda("B"), sonda("C")));
        when(lecturaRepository.findUltimasPorSonda(any()))
            .thenReturn(List.of(new Lectura("A", 9.0, LocalDateTime.now()),
                                new Lectura("B", 25.0, LocalDateTime.now())));
        var resultado = service.listar();
        assertEquals(3, resultado.size());
        assertNull(resultado.get(2).profundidadActual());
        assertTrue(resultado.get(1).enAlerta());
        verify(lecturaRepository, org.mockito.Mockito.times(1)).findUltimasPorSonda(any());
        org.mockito.Mockito.verify(lecturaRepository, org.mockito.Mockito.never())
            .findFirstByIdSondaOrderByFechaHoraDescIdLecturaDesc(any());
    }

    /** Regresión #9: el valor firmado negativo es válido con una referencia definida. */
    @Test
    void aceptaProfundidadNegativaComoLecturaFirmada() {
        var solicitud = new com.deeptrack.dto.SondaRequest(
            "SN-QA-001", "A1", 27.3, -109.9, "ACTIVA", -5.0);
        try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
            var errores = factory.getValidator().validate(solicitud);
            assertTrue(errores.isEmpty(),
                "Una lectura firmada negativa debe aceptarse cuando se conserva su signo");
        }
    }

    @Test
    void listadoIncluyeFechaYVigenciaSinConsultasAdicionales() {
        LocalDateTime fecha = LocalDateTime.now().minusHours(72);
        when(sondaRepository.findAll()).thenReturn(List.of(sonda("A"), sonda("B")));
        when(lecturaRepository.findUltimasPorSonda(any()))
            .thenReturn(List.of(new Lectura("A", 25.0, fecha)));
        var resultado = service.listar();
        assertEquals(fecha, resultado.get(0).ultimaLecturaFechaHora());
        assertEquals("ATRASADA", resultado.get(0).vigenciaLectura());
        assertTrue(resultado.get(0).enAlerta());
        assertNull(resultado.get(1).ultimaLecturaFechaHora());
        assertEquals("SIN_DATOS", resultado.get(1).vigenciaLectura());
        verify(lecturaRepository).findUltimasPorSonda(any());
        org.mockito.Mockito.verify(lecturaRepository, org.mockito.Mockito.never())
            .findFirstByIdSondaOrderByFechaHoraDescIdLecturaDesc(any());
    }
}
