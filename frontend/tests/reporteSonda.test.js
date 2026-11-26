import test from 'node:test';
import assert from 'node:assert/strict';
import { readSheet } from 'read-excel-file/node';
import { prepararHistorico } from '../src/utils/monitoreoSonda.js';
import { crearReporteSonda } from '../src/utils/reporteSonda.js';
import { generarExcelSonda } from '../src/utils/exportarExcelSonda.js';
import { generarPdfSonda } from '../src/utils/exportarPdfSonda.js';

const sonda = { idSonda: '=1+1', cuadrante: 'A1', estado: 'ACTIVA', profundidadActual: -2.35,
  ultimaLecturaFechaHora: '2026-11-26T12:00:00.123456', vigenciaLectura: 'RECIENTE' };
const puntos = prepararHistorico([
  { fechaHora: '2026-11-25T12:00:00', profundidadM: 12.34 },
  { fechaHora: '2026-11-25T14:00:00', profundidadM: null },
  { fechaHora: '2026-11-26T12:00:00.123456', profundidadM: -2.35 },
]);
const reporte = crearReporteSonda(sonda, 'mes', puntos, new Date('2026-11-26T20:00:00Z'));

test('reporte captura el periodo y no modifica los datos mostrados', () => {
  assert.equal(reporte.periodo, 'Último mes');
  assert.equal(reporte.resumen.cantidad, 2);
  assert.ok(Math.abs(reporte.resumen.variacion + 14.69) < 1e-10);
  assert.equal(reporte.nombre, 'DeepTrack-_1_1-mes-2026-11-26');
  assert.throws(() => crearReporteSonda(sonda, 'mes', []), /lecturas válidas/);
  assert.throws(() => crearReporteSonda(sonda, 'decada', puntos), /Periodo inválido/);
});

test('xlsx auténtico conserva tipos, decimales, fecha literal y texto no ejecutable', async () => {
  const blob = await generarExcelSonda(reporte);
  const buffer = Buffer.from(await blob.arrayBuffer());
  const filas = await readSheet(buffer, 'Lecturas');
  assert.deepEqual(filas.slice(1), [
    ['2026-11-25T12:00:00', 12.34],
    ['2026-11-25T14:00:00', null],
    ['2026-11-26T12:00:00.123456', -2.35],
  ]);
  const resumen = Object.fromEntries((await readSheet(buffer, 'Resumen')).slice(1));
  assert.equal(resumen.Sonda, '=1+1');
  assert.equal(resumen['Lecturas válidas'], 2);
  assert.equal(resumen['Registros sin valor válido'], 1);
  assert.ok(Math.abs(resumen['Variación última - primera (m)'] + 14.69) < 1e-10);
});

test('pdf real incluye identificación, indicadores, gráfica y fecha', async () => {
  const pdf = generarPdfSonda(reporte);
  const bytes = Buffer.from(await pdf.arrayBuffer()).toString('latin1');
  assert.ok(bytes.startsWith('%PDF-'));
  assert.ok(bytes.includes('DeepTrack Yaqui'));
  assert.ok(bytes.includes('Sonda =1+1'));
  assert.ok(bytes.includes('-14.69 m'));
  assert.ok(bytes.includes('Tendencia del periodo'));
  assert.ok(bytes.includes('2026-11-26T20:00:00.000Z'));
  assert.ok(bytes.includes('%%EOF'));
});
