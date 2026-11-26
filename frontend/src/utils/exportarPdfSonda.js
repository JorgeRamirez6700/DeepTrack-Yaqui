import { jsPDF } from 'jspdf';
import { metros } from './monitoreoSonda.js';
import { NOTA_REPORTE } from './reporteSonda.js';

const INK = '#1B4552';
const SECONDARY = '#526B6C';
const dateLabel = t => new Date(t).toISOString().slice(0, 16).replace('T', ' ');

function grafica(doc, r) {
  const x = 24, y = 132, w = 169, h = 83;
  const { minimo, maximo } = r.resumen;
  const margen = minimo === maximo ? Math.max(Math.abs(minimo) * .05, .1) : (maximo - minimo) * .08;
  const min = minimo - margen, max = maximo + margen;
  const t0 = r.puntos[0].tiempo, t1 = r.puntos[r.puntos.length - 1].tiempo;
  const px = t => t0 === t1 ? x + w / 2 : x + (t - t0) / (t1 - t0) * w;
  const py = v => y + h - (v - min) / (max - min) * h;
  doc.setFontSize(8).setTextColor(SECONDARY).setLineWidth(.15);
  for (let i = 0; i <= 4; i++) {
    const v = min + (max - min) * i / 4;
    const yy = py(v);
    doc.setDrawColor('#DCE6E5').line(x, yy, x + w, yy);
    doc.text(v.toFixed(2), x - 2, yy + 1, { align: 'right' });
  }
  doc.setDrawColor(SECONDARY).line(x, y, x, y + h).line(x, y + h, x + w, y + h);
  doc.text('m', x - 2, y - 3, { align: 'right' });
  const ticks = t0 === t1 ? [t0] : [t0, t0 + (t1 - t0) / 2, t1];
  ticks.forEach((t, i) => doc.text(dateLabel(t), px(t), y + h + 5, {
    align: ticks.length === 1 || i === 1 ? 'center' : i === 0 ? 'left' : 'right',
  }));
  doc.setDrawColor('#2E6E7E').setFillColor('#2E6E7E').setLineWidth(.5);
  let anterior = null;
  for (const p of r.puntos) {
    if (!Number.isFinite(p.profundidadM)) { anterior = null; continue; }
    const punto = [px(p.tiempo), py(p.profundidadM)];
    if (anterior) doc.line(...anterior, ...punto);
    // Mantiene visibles las mediciones aisladas, sin enlazar huecos.
    doc.circle(...punto, .45, 'F');
    anterior = punto;
  }
}

export function generarPdfSonda(r) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
  doc.setProperties({ title: 'DeepTrack Yaqui - Reporte individual', subject: 'Histórico de sonda', creator: 'DeepTrack Yaqui' });
  doc.setFillColor(INK).rect(0, 0, 210, 32, 'F');
  doc.setTextColor('#FFFFFF').setFont('helvetica', 'bold').setFontSize(20).text('DeepTrack Yaqui', 16, 15);
  doc.setFont('helvetica', 'normal').setFontSize(11).text('REPORTE INDIVIDUAL DE MONITOREO', 16, 24);
  doc.setTextColor(INK).setFont('helvetica', 'bold').setFontSize(15).text('Sonda ' + r.id, 16, 43, { maxWidth: 178 });
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(SECONDARY);
  doc.text('Cuadrante: ' + r.cuadrante + '  |  Estado: ' + r.estado, 16, 51, { maxWidth: 178 });
  doc.text('Periodo: ' + r.periodo, 16, 58);
  doc.text('Registros: ' + r.desde + ' a ' + r.hasta, 16, 65, { maxWidth: 178 });
  doc.text('Última lectura general: ' + metros(r.ultimaLectura) + '  |  ' + r.fechaUltima, 16, 72, { maxWidth: 178 });
  doc.text('Vigencia al consultar: ' + r.vigencia, 16, 79);
  const celdas = [
    ['Lecturas válidas', String(r.resumen.cantidad)],
    ['Mínima', metros(r.resumen.minimo)],
    ['Promedio', metros(r.resumen.promedio)],
    ['Máxima', metros(r.resumen.maximo)],
    ['Variación', metros(r.resumen.variacion, true)],
  ];
  celdas.forEach(([titulo, valor], i) => {
    const x = 16 + i * 36;
    doc.setFillColor('#EEF4F3').roundedRect(x, 87, 34, 22, 2, 2, 'F');
    doc.setTextColor(SECONDARY).setFontSize(8).setFont('helvetica', 'normal').text(titulo, x + 2, 94);
    doc.setTextColor(INK).setFontSize(11).setFont('helvetica', 'bold').text(valor, x + 2, 103, { maxWidth: 30 });
  });
  doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(INK).text('Tendencia del periodo', 16, 122);
  doc.setFont('helvetica', 'normal');
  grafica(doc, r);
  doc.setFontSize(9).setTextColor(SECONDARY);
  doc.text('Variación = última menos primera lectura válida. Registros sin valor válido: ' + (r.puntos.length - r.resumen.cantidad), 16, 234, { maxWidth: 178 });
  doc.text(doc.splitTextToSize(NOTA_REPORTE, 178), 16, 244);
  doc.setDrawColor('#DCE6E5').line(16, 274, 194, 274);
  doc.setFontSize(8).text('Generado (UTC): ' + r.fechaGeneracion, 16, 280);
  doc.text('1 / 1', 194, 280, { align: 'right' });
  return doc.output('blob');
}
