// Cliente HTTP centralizado hacia el backend (ver docs: Arquitectura Técnica, sección 4).
const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let message = 'Ocurrió un error. Intenta de nuevo.';
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    throw new Error(message);
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  login: (usuario, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ usuario, password }) }),

  listarSondas: () => request('/sondas'),
  crearSonda: (data) => request('/sondas', { method: 'POST', body: JSON.stringify(data) }),
  actualizarSonda: (id, data) =>
    request(`/sondas/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminarSonda: (id) => request(`/sondas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  historico: (id, rango) =>
    request(`/sondas/${encodeURIComponent(id)}/historico?rango=${encodeURIComponent(rango)}`),

  crearUsuario: (data) => request('/usuarios', { method: 'POST', body: JSON.stringify(data) }),
};
