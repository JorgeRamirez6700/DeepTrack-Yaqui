package com.deeptrack.service;

import com.deeptrack.dto.LecturaPuntoDTO;
import com.deeptrack.dto.SondaDTO;
import com.deeptrack.dto.SondaRequest;
import com.deeptrack.exception.ApiException;
import com.deeptrack.model.Lectura;
import com.deeptrack.model.Sonda;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SondaService {

    private final SondaRepository sondaRepository;
    private final LecturaRepository lecturaRepository;
    private final double umbralAlertaMetros;

    public SondaService(SondaRepository sondaRepository,
                        LecturaRepository lecturaRepository,
                        @Value("${deeptrack.alerta.umbral-metros:20}") double umbralAlertaMetros) {
        this.sondaRepository = sondaRepository;
        this.lecturaRepository = lecturaRepository;
        this.umbralAlertaMetros = umbralAlertaMetros;
    }

    /** RF-02 / RF-03: todas las sondas con su última lectura. */
    @Transactional(readOnly = true)
    public List<SondaDTO> listar() {
        return sondaRepository.findAll().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public SondaDTO obtener(String idSonda) {
        return toDto(buscar(idSonda));
    }

    /** HU-10: alta de sonda. */
    @Transactional
    public SondaDTO crear(SondaRequest req) {
        String idNormalizado = req.idSonda().trim();
        if (sondaRepository.existsById(idNormalizado)) {
            throw ApiException.conflict("Ya existe una sonda con el ID " + idNormalizado);
        }
        Sonda sonda = new Sonda();
        sonda.setIdSonda(idNormalizado);
        aplicarCampos(sonda, req);
        sondaRepository.save(sonda);
        registrarLecturaSiViene(sonda.getIdSonda(), req.profundidadActual());
        return toDto(sonda);
    }

    /** HU-11: edición de sonda. El ID no cambia. */
    @Transactional
    public SondaDTO actualizar(String idSonda, SondaRequest req) {
        Sonda sonda = buscar(idSonda);
        aplicarCampos(sonda, req);
        sondaRepository.save(sonda);
        registrarLecturaSiViene(idSonda, req.profundidadActual());
        return toDto(sonda);
    }

    /**
     * HU-12: eliminación física (sonda + lecturas).
     * PENDIENTE de decisión de producto: ¿borrado físico o cambio a estado INACTIVA
     * para conservar el histórico? (ver Backlog, HU-12).
     */
    @Transactional
    public void eliminar(String idSonda) {
        buscar(idSonda);
        lecturaRepository.deleteByIdSonda(idSonda);
        sondaRepository.deleteById(idSonda);
    }

    /** RF-04 / RF-05: serie histórica (dia | semana | mes | 6meses | anio). */
    @Transactional(readOnly = true)
    public List<LecturaPuntoDTO> historico(String idSonda, String rango) {
        buscar(idSonda);
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime desde = switch (rango) {
            case "dia" -> ahora.minusDays(1);
            case "semana" -> ahora.minusWeeks(1);
            case "mes" -> ahora.minusMonths(1);
            case "6meses" -> ahora.minusMonths(6);
            case "anio" -> ahora.minusYears(1);
            default -> throw ApiException.badRequest("Rango inválido. Usa: dia, semana, mes, 6meses o anio");
        };
        return lecturaRepository.findByIdSondaAndFechaHoraAfterOrderByFechaHoraAsc(idSonda, desde).stream()
                .map(l -> new LecturaPuntoDTO(l.getFechaHora(), l.getProfundidadM()))
                .toList();
    }

    // ---------- helpers ----------

    private Sonda buscar(String idSonda) {
        return sondaRepository.findById(idSonda)
                .orElseThrow(() -> ApiException.notFound("No existe la sonda " + idSonda));
    }

    private void aplicarCampos(Sonda sonda, SondaRequest req) {
        sonda.setCuadrante(req.cuadrante().trim());
        sonda.setLatitud(req.latitud());
        sonda.setLongitud(req.longitud());
        sonda.setEstado(req.estado() == null ? "ACTIVA" : req.estado());
    }

    private void registrarLecturaSiViene(String idSonda, Double profundidad) {
        if (profundidad == null) return;
        Double ultima = lecturaRepository.findFirstByIdSondaOrderByFechaHoraDesc(idSonda)
                .map(Lectura::getProfundidadM).orElse(null);
        if (ultima == null || !ultima.equals(profundidad)) {
            lecturaRepository.save(new Lectura(idSonda, profundidad, LocalDateTime.now()));
        }
    }

    private SondaDTO toDto(Sonda s) {
        Double actual = lecturaRepository.findFirstByIdSondaOrderByFechaHoraDesc(s.getIdSonda())
                .map(Lectura::getProfundidadM).orElse(null);
        boolean enAlerta = actual != null && actual > umbralAlertaMetros;
        return new SondaDTO(s.getIdSonda(), s.getCuadrante(), s.getLatitud(), s.getLongitud(),
                s.getEstado(), actual, enAlerta);
    }
}
