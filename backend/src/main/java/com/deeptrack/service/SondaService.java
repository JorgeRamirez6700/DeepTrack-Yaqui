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
import java.util.Map;
import java.util.stream.Collectors;

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
        List<Sonda> sondas = sondaRepository.findAll();
        if (sondas.isEmpty()) return List.of();
        Map<String, Double> ultimas = lecturaRepository.findUltimasPorSonda(
                sondas.stream().map(Sonda::getIdSonda).toList()).stream()
                .collect(Collectors.toMap(Lectura::getIdSonda, Lectura::getProfundidadM));
        return sondas.stream()
                .map(sonda -> toDto(sonda, ultimas.get(sonda.getIdSonda())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SondaDTO obtener(String idSonda) {
        return toDto(buscar(idSonda));
    }

    /** HU-10: alta de sonda. */
    @Transactional
    public SondaDTO crear(SondaRequest req) {
        validarLectura(req.profundidadActual());
        String idNormalizado = req.idSonda().trim();
        if (sondaRepository.existsById(idNormalizado)) {
            throw ApiException.conflict("Ya existe una sonda con el ID " + idNormalizado);
        }
        Sonda sonda = new Sonda();
        sonda.setIdSonda(idNormalizado);
        aplicarCampos(sonda, req);
        sondaRepository.save(sonda);
        registrarLecturaSiActiva(sonda, req.profundidadActual());
        return toDto(sonda);
    }

    /** HU-11: edición de sonda. El ID no cambia. */
    @Transactional
    public SondaDTO actualizar(String idSonda, SondaRequest req) {
        validarLectura(req.profundidadActual());
        Sonda sonda = buscar(idSonda);
        aplicarCampos(sonda, req);
        sondaRepository.save(sonda);
        registrarLecturaSiActiva(sonda, req.profundidadActual());
        return toDto(sonda);
    }

    /**
     * HU-12: retiro lógico. Se conserva el ID y el historial de lecturas para consulta.
     * El endpoint DELETE mantiene la compatibilidad REST, pero jamás borra datos.
     */
    @Transactional
    public void eliminar(String idSonda) {
        Sonda sonda = buscar(idSonda);
        if ("RETIRADA".equals(sonda.getEstado())) {
            throw ApiException.conflict("La sonda ya se encuentra retirada");
        }
        sonda.setEstado("RETIRADA");
        sondaRepository.save(sonda);
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
        // Una nueva sonda ya tiene ACTIVA por defecto en la entidad.
        // Si se omite el estado al editar, se conserva el actual.
        if (req.estado() != null) sonda.setEstado(req.estado());
    }

    private static void validarLectura(Double profundidad) {
        if (profundidad != null && !Double.isFinite(profundidad)) {
            throw ApiException.badRequest("La lectura debe ser un número finito");
        }
    }

    private void registrarLecturaSiActiva(Sonda sonda, Double profundidad) {
        if (profundidad == null) return;
        if (!"ACTIVA".equals(sonda.getEstado())) {
            throw ApiException.badRequest("Solo las sondas ACTIVAS pueden registrar nuevas lecturas");
        }
        String idSonda = sonda.getIdSonda();
        Double ultima = lecturaRepository.findFirstByIdSondaOrderByFechaHoraDesc(idSonda)
                .map(Lectura::getProfundidadM).orElse(null);
        if (ultima == null || !ultima.equals(profundidad)) {
            lecturaRepository.save(new Lectura(idSonda, profundidad, LocalDateTime.now()));
        }
    }

    private SondaDTO toDto(Sonda s) {
        Double actual = lecturaRepository.findFirstByIdSondaOrderByFechaHoraDesc(s.getIdSonda())
                .map(Lectura::getProfundidadM).orElse(null);
        return toDto(s, actual);
    }

    private SondaDTO toDto(Sonda s, Double actual) {
        boolean enAlerta = "ACTIVA".equals(s.getEstado()) && actual != null && actual > umbralAlertaMetros;
        return new SondaDTO(s.getIdSonda(), s.getCuadrante(), s.getLatitud(), s.getLongitud(),
                s.getEstado(), actual, enAlerta);
    }
}
