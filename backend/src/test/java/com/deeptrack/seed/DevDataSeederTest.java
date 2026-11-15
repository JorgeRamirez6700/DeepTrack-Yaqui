package com.deeptrack.seed;

import com.deeptrack.model.Lectura;
import com.deeptrack.repository.LecturaRepository;
import com.deeptrack.repository.SondaRepository;
import com.deeptrack.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DevDataSeederTest {

    @Mock SondaRepository sondas;
    @Mock LecturaRepository lecturas;
    @Mock UsuarioRepository usuarios;
    @Mock PasswordEncoder encoder;
    @InjectMocks DevDataSeeder seeder;

    @Test
    void noSobrescribeDatosSiYaExisten() {
        when(usuarios.count()).thenReturn(2L);
        when(sondas.count()).thenReturn(5L);
        seeder.run();
        verify(usuarios, never()).save(any());
        verify(sondas, never()).save(any());
        verify(lecturas, never()).saveAll(anyList());
    }

    @Test
    void creaLecturasCuandoLaBaseEstaVacia() {
        when(usuarios.count()).thenReturn(1L);
        when(sondas.count()).thenReturn(0L);
        seeder.run();
        verify(sondas, times(5)).save(any());
        // 365 lecturas diarias + 5 intradía + la última = 371 por sonda.
        verify(lecturas, times(5)).saveAll(argThat(lista -> {
            int cantidad = 0;
            for (Object lectura : lista) {
                if (!(lectura instanceof Lectura)) return false;
                cantidad++;
            }
            return cantidad == 371;
        }));
    }
}
