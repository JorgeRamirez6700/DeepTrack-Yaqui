package com.deeptrack.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.deeptrack.repository.UsuarioRepository;
import com.deeptrack.model.Usuario;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:securitytest;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.h2.console.enabled=false"
})
@AutoConfigureMockMvc
class SecurityIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UsuarioRepository usuarios;

    @Test
    void rechazaConsultasSinAutenticacion() throws Exception {
        mvc.perform(get("/api/sondas")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void rechazaLoginSinCsrf() throws Exception {
        mvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void sesionDeAnalistaPuedeLeerPeroNoAdministrarUsuarios() throws Exception {
        MvcResult csrfResult = mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        assertNotNull(session);
        JsonNode csrf = json.readTree(csrfResult.getResponse().getContentAsString());
        String token = csrf.get("token").asText();

        mvc.perform(post("/api/auth/login")
                        .session(session)
                        .header("X-CSRF-TOKEN", token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"usuario\":\"analista\",\"password\":\"analista123\"}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("ANALISTA"));
        mvc.perform(get("/api/sondas").session(session)).andExpect(status().isOk());
        mvc.perform(get("/api/usuarios").session(session)).andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/logout").session(session).header("X-CSRF-TOKEN", token))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/sondas")).andExpect(status().isUnauthorized());
    }
    @Test
    void revocaSesionDeUsuarioDesactivado() throws Exception {
        MvcResult csrfResult = mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        assertNotNull(session);
        String token = json.readTree(csrfResult.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(post("/api/auth/login").session(session)
                .header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"analista\",\"password\":\"analista123\"}"))
                .andExpect(status().isOk());

        Usuario usuario = usuarios.findByUsuarioLogin("analista").orElseThrow();
        String estadoOriginal = usuario.getEstado();
        try {
            usuario.setEstado("INACTIVO");
            usuarios.saveAndFlush(usuario);
            mvc.perform(get("/api/sondas").session(session))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.message").value("La sesión ya no es válida"));
        } finally {
            usuario.setEstado(estadoOriginal);
            usuarios.saveAndFlush(usuario);
        }
    }

    @Test
    void revocaSesionCuandoCambiaElRol() throws Exception {
        MvcResult csrfResult = mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        String token = json.readTree(csrfResult.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(post("/api/auth/login").session(session)
                .header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"analista\",\"password\":\"analista123\"}"))
                .andExpect(status().isOk());

        Usuario usuario = usuarios.findByUsuarioLogin("analista").orElseThrow();
        String rolOriginal = usuario.getRol();
        try {
            usuario.setRol("CONSULTA");
            usuarios.saveAndFlush(usuario);
            mvc.perform(get("/api/sondas").session(session))
                    .andExpect(status().isUnauthorized());
        } finally {
            usuario.setRol(rolOriginal);
            usuarios.saveAndFlush(usuario);
        }
    }

    @Test
    void conservaEstadoOmitidoYValidaLecturasFirmadasPorHttp() throws Exception {
        MvcResult csrfResult = mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk()).andReturn();
        MockHttpSession session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        String token = json.readTree(csrfResult.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(post("/api/auth/login").session(session)
                .header("X-CSRF-TOKEN", token).contentType(MediaType.APPLICATION_JSON)
                .content("{\"usuario\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk());

        String id = "QA-ISSUES-09-14";
        String path = "/api/sondas/" + id;
        String base = "{\"idSonda\":\"" + id + "\",\"cuadrante\":\"QA\",\"latitud\":27.3,\"longitud\":-109.9";
        // Un número no finito no crea el registro ni una lectura.
        for (String valor : new String[]{"\"NaN\"", "\"Infinity\"", "\"-Infinity\"", "1e400"}) {
            mvc.perform(post("/api/sondas").session(session).header("X-CSRF-TOKEN", token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(base + ",\"profundidadActual\":" + valor + "}"))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(get(path).session(session)).andExpect(status().isNotFound());

        mvc.perform(post("/api/sondas").session(session).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"profundidadActual\":-12.34}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("ACTIVA"))
                .andExpect(jsonPath("$.profundidadActual").value(-12.34));
        mvc.perform(put(path).session(session).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"profundidadActual\":12.34}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profundidadActual").value(12.34));
        mvc.perform(put(path).session(session).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(base + ",\"profundidadActual\":\"NaN\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get(path).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.profundidadActual").value(12.34));

        mvc.perform(delete(path).session(session).header("X-CSRF-TOKEN", token))
                .andExpect(status().isNoContent());
        for (String estado : new String[]{"", ",\"estado\":null"}) {
            mvc.perform(put(path).session(session).header("X-CSRF-TOKEN", token)
                    .contentType(MediaType.APPLICATION_JSON).content(base + estado + "}"))
                    .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("RETIRADA"))
                    .andExpect(jsonPath("$.enAlerta").value(false));
        }
        mvc.perform(put(path).session(session).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON).content(base + ",\"profundidadActual\":3}"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(path).session(session).header("X-CSRF-TOKEN", token)
                .contentType(MediaType.APPLICATION_JSON).content(base + ",\"estado\":\"ACTIVA\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.estado").value("ACTIVA"));
        mvc.perform(get(path + "/historico").session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].profundidadM").value(-12.34))
                .andExpect(jsonPath("$[1].profundidadM").value(12.34));
    }

}
