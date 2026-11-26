import test from 'node:test';
import assert from 'node:assert/strict';
import { etiquetaVigencia, fechaRegistrada, prepararHistorico, resumenHistorico, metros } from '../src/utils/monitoreoSonda.js';
import { filtrarSondas } from '../src/utils/filtrarSondas.js';

test('indicadores respetan signo, orden temporal y valores ausentes', () => {
  const puntos = prepararHistorico([
    { fechaHora: '2026-11-26T12:00:00', profundidadM: -2.35 },
    { fechaHora: '2026-11-25T12:00:00', profundidadM: 12.34 },
    { fechaHora: '2026-11-25T13:00:00', profundidadM: null },
    { fechaHora: '2026-11-25T15:00:00', profundidadM: 0 },
    { fechaHora: 'inválida', profundidadM: 99 },
  ]);
  assert.equal(puntos.length, 4);
  assert.equal(puntos[1].profundidadM, null);
  const r = resumenHistorico(puntos);
  assert.equal(r.cantidad, 3);
  assert.equal(r.minimo, -2.35);
  assert.equal(r.maximo, 12.34);
  assert.ok(Math.abs(r.promedio - 3.33) < 1e-10);
  assert.equal(metros(r.variacion, true), '-14.69 m');
});

test('sin datos y una sola lectura no inventan variación', () => {
  assert.deepEqual(resumenHistorico([]), { cantidad: 0, minimo: null, maximo: null, promedio: null, variacion: null });
  assert.deepEqual(resumenHistorico([{ profundidadM: 0 }]), { cantidad: 1, minimo: 0, maximo: 0, promedio: 0, variacion: null });
});

test('fecha local registrada conserva día y hora sin reinterpretar zona', () => {
  assert.equal(fechaRegistrada('2026-11-26T03:20:15.123456'), '2026-11-26 03:20:15');
  assert.equal(fechaRegistrada(null), 'Sin fecha');
  assert.equal(etiquetaVigencia({ vigenciaLectura: 'ATRASADA' }), 'Lectura atrasada');
});

test('vigencia no reemplaza condición ni estado operativo', () => {
  const sondas = [
    { idSonda: 'A', cuadrante: 'QA', estado: 'ACTIVA', profundidadActual: 25, enAlerta: true, vigenciaLectura: 'ATRASADA' },
    { idSonda: 'B', cuadrante: 'QA', estado: 'RETIRADA', profundidadActual: 25, enAlerta: false, vigenciaLectura: 'ATRASADA' },
    { idSonda: 'C', cuadrante: 'QA', estado: 'ACTIVA', profundidadActual: 12, enAlerta: false, vigenciaLectura: 'RECIENTE' },
  ];
  assert.deepEqual(filtrarSondas(sondas, '', 'alert', 'all', 'ATRASADA').map(s => s.idSonda), ['A']);
  assert.deepEqual(filtrarSondas(sondas, '', 'all', 'RETIRADA', 'ATRASADA').map(s => s.idSonda), ['B']);
  assert.deepEqual(filtrarSondas(sondas, '', 'normal', 'all', 'ATRASADA'), []);
});
