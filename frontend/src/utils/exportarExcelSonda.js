import writeExcelFile from 'write-excel-file/universal';
import { NOTA_REPORTE } from './reporteSonda.js';

const encabezado = value => ({ value, fontWeight: 'bold', backgroundColor: '#1B4552', textColor: '#FFFFFF' });
const numero = value => Number.isFinite(value) ? { value, type: Number, format: '0.00########' } : null;
const texto = value => ({ value: String(value), type: String });

export function hojasReporte(r) {
  return [
    {
      sheet: 'Resumen', columns: [{ width: 34 }, { width: 76 }], stickyRowsCount: 1,
      data: [
        [encabezado('DeepTrack Yaqui'), encabezado('Reporte individual')],
        ['Sonda', texto(r.id)], ['Cuadrante', texto(r.cuadrante)], ['Estado operativo', texto(r.estado)],
        ['Periodo seleccionado', r.periodo], ['Primera fecha registrada', r.desde], ['Última fecha registrada del periodo', r.hasta],
        ['Generado (UTC)', r.fechaGeneracion], ['Última lectura general (m)', numero(r.ultimaLectura)],
        ['Fecha última lectura general', r.fechaUltima], ['Vigencia al consultar', r.vigencia],
        ['Lecturas válidas', r.resumen.cantidad], ['Registros sin valor válido', r.puntos.length - r.resumen.cantidad],
        ['Mínima (m)', numero(r.resumen.minimo)], ['Promedio (m)', numero(r.resumen.promedio)],
        ['Máxima (m)', numero(r.resumen.maximo)], ['Variación última - primera (m)', numero(r.resumen.variacion)],
        ['Referencia y método', { value: NOTA_REPORTE, wrap: true }],
        ['Fechas', 'Texto ISO original sin conversión de zona ni pérdida de precisión.'],
      ],
    },
    {
      sheet: 'Lecturas', columns: [{ width: 36 }, { width: 24 }], stickyRowsCount: 1,
      data: [
        [encabezado('Fecha y hora registrada (ISO)'), encabezado('Lectura (m)')],
        ...r.puntos.map(p => [texto(p.fechaHora), numero(p.profundidadM)]),
      ],
    },
  ];
}

export async function generarExcelSonda(reporte) {
  return writeExcelFile(hojasReporte(reporte), { fontFamily: 'Calibri', fontSize: 11 }).toBlob();
}
