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
        service = new SondaService(sondaRepository, lecturaRepository, 20.0);
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
        when(lecturaRepository.findFirstByIdSondaOrderByFechaHoraDesc("SN-1"))
                .thenReturn(Optional.of(new Lectura("SN-1", 24.6, LocalDateTime.now())));

        SondaDTO dto = service.listar().get(0);

        assertEquals(24.6, dto.profundidadActual());
        assertTrue(dto.enAlerta());
    }

    @Test
    void noMarcaAlertaCuandoLaProfundidadEstaBajoElUmbral() {
        when(sondaRepository.findAll()).thenReturn(List.of(sonda("SN-2")));
        when(lecturaRepository.findFirstByIdSondaOrderByFechaHoraDesc("SN-2"))
                .thenReturn(Optional.of(new Lectura("SN-2", 11.2, LocalDateTime.now())));

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
        when(lecturaRepository.findByIdSondaAndFechaHoraAfterOrderByFechaHoraAsc(eq("SN-3"), any(LocalDateTime.class)))
                .thenReturn(List.of());

        LocalDateTime antes = LocalDateTime.now().minusDays(1);
        assertTrue(service.historico("SN-3", "dia").isEmpty());
        LocalDateTime despues = LocalDateTime.now().minusDays(1);
        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(lecturaRepository).findByIdSondaAndFechaHoraAfterOrderByFechaHoraAsc(eq("SN-3"), captor.capture());
        assertFalse(captor.getValue().isBefore(antes));
        assertFalse(captor.getValue().isAfter(despues));
    }

    @Test
    void historicoAceptaRangoSemana() {
        when(sondaRepository.findById("SN-3")).thenReturn(Optional.of(sonda("SN-3")));
        when(lecturaRepository.findByIdSondaAndFechaHoraAfterOrderByFechaHoraAsc(eq("SN-3"), any(LocalDateTime.class)))
                .thenReturn(List.of());

        LocalDateTime antes = LocalDateTime.now().minusWeeks(1);
        assertTrue(service.historico("SN-3", "semana").isEmpty());
        LocalDateTime despues = LocalDateTime.now().minusWeeks(1);
        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(lecturaRepository).findByIdSondaAndFechaHoraAfterOrderByFechaHoraAsc(eq("SN-3"), captor.capture());
        assertFalse(captor.getValue().isBefore(antes));
        assertFalse(captor.getValue().isAfter(despues));
    }

}
