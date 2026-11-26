// Cliente REST centralizado. El navegador conserva la sesión mediante cookie HttpOnly.
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    // Spring Security exige un token CSRF incluso al iniciar sesión.
    const csrfRes = await fetch(`${BASE}/api/auth/csrf`, { credentials: 'include' });
    if (!csrfRes.ok) throw new Error('No se pudo iniciar la sesión de seguridad.');
    const csrf = await csrfRes.json();
    headers[csrf.headerName] = csrf.token;
  }
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    method,
    credentials: 'include',
    headers,
  });
  if (!res.ok) {
    if (res.status === 401 && !['/auth/login', '/auth/me'].includes(path)) {
      window.dispatchEvent(new Event('deeptrack:session-expired'));
    }
    let message = 'Ocurrió un error. Intenta de nuevo.';
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  login: (usuario, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, password }) }),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  listarSondas: () => request('/sondas'),
  resumenValle: (periodo) => request(`/estadisticas/resumen?periodo=${encodeURIComponent(periodo)}`),
  tendenciaValle: (meses = 12) => request(`/reportes/tendencia?meses=${meses}`),
  reporteMensual: (anio, mes) => request(`/reportes/mensual?anio=${anio}&mes=${mes}`),
  crearSonda: (data) => request('/sondas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarSonda: (id, data) =>
    request(`/sondas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarSonda: (id) => request(`/sondas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  historico: (id, rango) =>
    request(`/sondas/${encodeURIComponent(id)}/historico?rango=${encodeURIComponent(rango)}`),
  historicoIntervalo: (id, { desde, hasta }) =>
    request('/sondas/' + encodeURIComponent(id) + '/historico/intervalo?' + new URLSearchParams({ desde, hasta })),
  analisis: ({ desde, hasta }, ids = []) => {
    const params = new URLSearchParams({ desde, hasta });
    ids.forEach(id => params.append('ids', id));
    return request('/estadisticas/analisis?' + params);
  },
  criteriosAlertas: () => request('/alertas/criterios'),
  historialAlertas: (id) => request('/alertas/' + encodeURIComponent(id) + '/historial'),
  listarUsuarios: () => request('/usuarios'),
  actualizarUsuario: (id, data) => request(`/usuarios/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify(data) }),
  crearUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
};
