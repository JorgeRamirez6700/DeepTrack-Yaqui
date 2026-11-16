package com.deeptrack.config;

import com.deeptrack.dto.LoginResponse;
import com.deeptrack.model.Usuario;
import com.deeptrack.repository.UsuarioRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Revoca las sesiones existentes cuando se desactiva un usuario o cambia su rol.
 * No se registra como filtro Servlet global: solo se agrega a Spring Security.
 */
public class SessionAccountValidationFilter extends OncePerRequestFilter {

    private final UsuarioRepository usuarios;

    public SessionAccountValidationFilter(UsuarioRepository usuarios) {
        this.usuarios = usuarios;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof LoginResponse principal) {
            Usuario actual = usuarios.findByUsuarioLogin(principal.usuario()).orElse(null);
            if (actual == null || !"ACTIVO".equals(actual.getEstado())
                    || !principal.rol().equals(actual.getRol())) {
                var session = request.getSession(false);
                if (session != null) session.invalidate();
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"status\":401,\"message\":\"La sesión ya no es válida\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
