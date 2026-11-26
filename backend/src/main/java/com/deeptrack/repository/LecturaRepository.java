package com.deeptrack.repository;

import com.deeptrack.model.Lectura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LecturaRepository extends JpaRepository<Lectura, Long> {

    /** Una sola consulta para obtener la última lectura de cada sonda.
     * Desempata por ID si coinciden fecha y hora; evita N+1 en el tablero. */
    @Query("""
        select l from Lectura l
        where l.idSonda in :ids and not exists (
            select 1 from Lectura newer where newer.idSonda = l.idSonda
              and (newer.fechaHora > l.fechaHora
                   or (newer.fechaHora = l.fechaHora and newer.idLectura > l.idLectura))
        )
        """)
    List<Lectura> findUltimasPorSonda(@Param("ids") Collection<String> ids);

    /** Última lectura de una sonda; mismo desempate por ID que el listado. */
    Optional<Lectura> findFirstByIdSondaOrderByFechaHoraDescIdLecturaDesc(String idSonda);

    /** Serie histórica hasta el instante de consulta, con orden estable en fechas empatadas. */
    List<Lectura> findByIdSondaAndFechaHoraGreaterThanAndFechaHoraLessThanEqualOrderByFechaHoraAscIdLecturaAsc(
            String idSonda, LocalDateTime desde, LocalDateTime hasta);

    /** Intervalo calendario inclusivo por día, limitado al instante de consulta. */
    @Query("""
        select l from Lectura l where l.idSonda in :ids
        and l.fechaHora >= :desde and l.fechaHora < :fin and l.fechaHora <= :ahora
        order by l.fechaHora, l.idLectura
        """)
    List<Lectura> findIntervalo(@Param("ids") Collection<String> ids,
            @Param("desde") LocalDateTime desde, @Param("fin") LocalDateTime fin,
            @Param("ahora") LocalDateTime ahora);

    /** Lecturas de un periodo para consolidar estadísticas entre sondas. */
    List<Lectura> findByFechaHoraGreaterThanEqualAndFechaHoraLessThanOrderByFechaHoraAsc(
            LocalDateTime inicio, LocalDateTime fin);

}
