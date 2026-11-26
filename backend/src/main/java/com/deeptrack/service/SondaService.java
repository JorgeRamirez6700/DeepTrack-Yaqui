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
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SondaService {

    private final SondaRepository sondaRepository;
    private final LecturaRepository lecturaRepository;
    private final ReglasAlerta reglasAlerta;
    private final long vigenciaHoras;

    public SondaService(SondaRepository sondaRepository,
                        LecturaRepository lecturaRepository,
                        ReglasAlerta reglasAlerta,
                        @Value("${deeptrack.monitoreo.vigencia-horas:0}") long vigenciaHoras) {
        this.sondaRepository = sondaRepository;
        this.lecturaRepository = lecturaRepository;
        this.reglasAlerta = reglasAlerta;
        this.vigenciaHoras = vigenciaHoras;
    }

    /** RF-02 / RF-03: todas las sondas con su última lectura. */
    @Transactional(readOnly = true)
    public List<SondaDTO> listar() {
        List<Sonda> sondas = sondaRepository.findAll();
        if (sondas.isEmpty()) return List.of();
        Map<String, Lectura> ultimas = lecturaRepository.findUltimasPorSonda(
                sondas.stream().map(Sonda::getIdSonda).toList()).stream()
                .collect(Collectors.toMap(Lectura::getIdSonda, lectura -> lectura));
        LocalDateTime ahora = LocalDateTime.now();
        return sondas.stream()
                .map(sonda -> toDto(sonda, ultimas.get(sonda.getIdSonda()), ahora))
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
        return lecturaRepository.findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(idSonda, desde, ahora).stream()
                .map(l -> new LecturaPuntoDTO(l.getFechaHora(), l.getProfundidadM()))
                .toList();
    }

    /** Fechas calendario inclusivas; no incluye registros futuros. */
    @Transactional(readOnly = true)
    public List<LecturaPuntoDTO> historicoIntervalo(String idSonda, LocalDate desde, LocalDate hasta) {
        var intervalo = IntervaloAnalisis.validar(desde, hasta, LocalDateTime.now());
        buscar(idSonda);
        return lecturaRepository.findIntervalo(List.of(idSonda), intervalo.inicio(), intervalo.fin(), intervalo.ahora())
                .stream().map(l -> new LecturaPuntoDTO(l.getFechaHora(), l.getProfundidadM())).toList();
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
        Double ultima = lecturaRepository.findFirstByIdSondaOrderByFechaHoraDescIdLecturaDesc(idSonda)
                .map(Lectura::getProfundidadM).orElse(null);
        if (ultima == null || !ultima.equals(profundidad)) {
            lecturaRepository.save(new Lectura(idSonda, profundidad, LocalDateTime.now()));
        }
    }

    private SondaDTO toDto(Sonda s) {
        Lectura ultima = lecturaRepository.findFirstByIdSondaOrderByFechaHoraDescIdLecturaDesc(s.getIdSonda())
                .orElse(null);
        return toDto(s, ultima, LocalDateTime.now());
    }

    private SondaDTO toDto(Sonda s, Lectura ultima, LocalDateTime ahora) {
        Double actual = ultima == null ? null : ultima.getProfundidadM();
        LocalDateTime fecha = ultima == null ? null : ultima.getFechaHora();
        var alerta = reglasAlerta.evaluar(s.getEstado(), actual, fecha, ahora);
        return new SondaDTO(s.getIdSonda(), s.getCuadrante(), s.getLatitud(), s.getLongitud(),
                s.getEstado(), actual, alerta.nivel() == ReglasAlerta.Nivel.CRITICA, fecha,
                VigenciaLectura.evaluar(fecha, ahora, vigenciaHoras), alerta.nivel().name(), alerta.motivo());
    }
}
