export function fechaLocal(d = new Date()) {
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
export function intervaloInicial() {
  const hoy = new Date(), inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - 29);
  return { desde: fechaLocal(inicio), hasta: fechaLocal(hoy) };
}
function diaValido(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s ?? '')) return false;
  const ms = Date.parse(s + 'T00:00:00Z');
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === s;
}
export function validarIntervalo({ desde, hasta }, hoy = fechaLocal()) {
  if (!diaValido(desde) || !diaValido(hasta) || desde < '2000-01-01' || desde > hasta || hasta > hoy ||
      (Date.parse(hasta) - Date.parse(desde)) / 86400000 >= 366) {
    return 'Selecciona fechas válidas, sin días futuros y con un máximo de 366 días.';
  }
  return '';
}
export function puntosComparacion(series) {
  const dias = new Map();
  series.forEach((serie, i) => serie.dias.forEach(d => {
    if (!dias.has(d.fecha)) dias.set(d.fecha, { fecha: d.fecha });
    dias.get(d.fecha)['s' + i] = d.promedioM;
  }));
  return [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
}
