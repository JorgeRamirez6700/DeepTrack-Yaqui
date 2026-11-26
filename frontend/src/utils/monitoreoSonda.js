// La API entrega LocalDateTime sin zona. Usamos UTC solo como escala de
// calendario para conservar literalmente la hora registrada, no como zona del sensor.
export function tiempoRegistrado(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso)) return NaN;
  return Date.parse(iso + 'Z');
}

export function fechaRegistrada(iso) {
  const t = tiempoRegistrado(iso);
  return Number.isFinite(t) ? new Date(t).toISOString().slice(0, 19).replace('T', ' ') : 'Sin fecha';
}

export const VIGENCIAS = {
  RECIENTE: 'Lectura reciente',
  ATRASADA: 'Lectura atrasada',
  SIN_DATOS: 'Sin mediciones',
  SIN_CRITERIO: 'Vigencia sin definir',
  FECHA_FUTURA: 'Fecha futura: revisar',
};

export function etiquetaVigencia(sonda) {
  return VIGENCIAS[sonda.vigenciaLectura] ?? 'Vigencia sin definir';
}

export function prepararHistorico(lecturas) {
  return lecturas
    .map(p => ({
      ...p,
      tiempo: tiempoRegistrado(p.fechaHora),
      profundidadM: Number.isFinite(p.profundidadM) ? p.profundidadM : null,
    }))
    .filter(p => Number.isFinite(p.tiempo))
    .sort((a, b) => a.tiempo - b.tiempo);
}

/** Estadística descriptiva del periodo; la variación es última menos primera. */
export function resumenHistorico(puntos) {
  let cantidad = 0, minimo = Infinity, maximo = -Infinity, promedio = 0;
  let primera = null, ultima = null;
  for (const p of puntos) {
    const v = p.profundidadM;
    if (!Number.isFinite(v)) continue;
    if (cantidad === 0) primera = v;
    ultima = v;
    cantidad++;
    minimo = Math.min(minimo, v);
    maximo = Math.max(maximo, v);
    promedio += (v - promedio) / cantidad;
  }
  return {
    cantidad, minimo: cantidad ? minimo : null, maximo: cantidad ? maximo : null,
    promedio: cantidad ? promedio : null, variacion: cantidad > 1 ? ultima - primera : null,
  };
}

export function metros(valor, firmado = false) {
  return Number.isFinite(valor) ? `${firmado && valor > 0 ? '+' : ''}${valor.toFixed(2)} m` : '—';
}
