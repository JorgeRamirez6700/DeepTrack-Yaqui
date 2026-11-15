package com.deeptrack.repository;

import com.deeptrack.model.Lectura;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LecturaRepository extends JpaRepository<Lectura, Long> {

    /** Última lectura de una sonda (RF-03: resumen / hover). */
    Optional<Lectura> findFirstByIdSondaOrderByFechaHoraDesc(String idSonda);

    /** Serie histórica desde una fecha (RF-04 / RF-05: gráfica y filtros de tiempo). */
    List<Lectura> findByIdSondaAndFechaHoraAfterOrderByFechaHoraAsc(String idSonda, LocalDateTime desde);

    void deleteByIdSonda(String idSonda);
}
