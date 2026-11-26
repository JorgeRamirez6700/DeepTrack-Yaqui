import { etiquetaVigencia, fechaRegistrada, resumenHistorico } from './monitoreoSonda.js';

export const RANGOS_SONDA = [
  { id: 'dia', label: 'Último día' },
  { id: 'semana', label: 'Última semana' },
  { id: 'mes', label: 'Último mes' },
  { id: '6meses', label: 'Últimos 6 meses' },
  { id: 'anio', label: 'Último año' },
];

export const NOTA_REPORTE = 'Estadística descriptiva. Hora de medición sin zona horaria definida; referencia física y signo pendientes de validación institucional. Vigencia no equivale a conectividad.';

// Captura los mismos puntos ya preparados para la gráfica; no vuelve a pedir datos.
export function crearReporteSonda(sonda, rango, puntos, generado = new Date()) {
  const periodo = RANGOS_SONDA.find(r => r.id === rango);
  if (!periodo) throw new Error('Periodo inválido');
  const resumen = resumenHistorico(puntos);
  if (!resumen.cantidad) throw new Error('No hay lecturas válidas para exportar');
  const id = String(sonda.idSonda);
  const valido = id.replace(/[^a-zA-Z0-9_-]/g, '_') || 'sonda';
  const fechaGeneracion = generado.toISOString();
  return {
    id, cuadrante: String(sonda.cuadrante), estado: String(sonda.estado),
    periodo: periodo.label, rango, fechaGeneracion,
    ultimaLectura: Number.isFinite(sonda.profundidadActual) ? sonda.profundidadActual : null,
    fechaUltima: fechaRegistrada(sonda.ultimaLecturaFechaHora),
    vigencia: etiquetaVigencia(sonda),
    desde: fechaRegistrada(puntos[0].fechaHora),
    hasta: fechaRegistrada(puntos[puntos.length - 1].fechaHora),
    puntos: puntos.map(p => ({ fechaHora: p.fechaHora, tiempo: p.tiempo, profundidadM: p.profundidadM })),
    resumen,
    nombre: 'DeepTrack-' + valido + '-' + rango + '-' + fechaGeneracion.slice(0, 10),
  };
}

export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Safari y otros navegadores pueden comenzar la descarga después del clic.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
