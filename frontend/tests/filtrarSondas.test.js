import test from 'node:test';
import assert from 'node:assert/strict';
import { condicionSonda, filtrarSondas } from '../src/utils/filtrarSondas.js';

const sondas = [
  { idSonda: 'ACT-1', cuadrante: 'A1', estado: 'ACTIVA', profundidadActual: 12, enAlerta: false },
  { idSonda: 'RET-1', cuadrante: 'B2', estado: 'RETIRADA', profundidadActual: 12, enAlerta: false },
  { idSonda: 'MAN-1', cuadrante: 'C3', estado: 'MANTENIMIENTO', profundidadActual: 12, enAlerta: false },
  { idSonda: 'INA-1', cuadrante: 'D4', estado: 'INACTIVA', profundidadActual: 12, enAlerta: false },
  { idSonda: 'ACT-2', cuadrante: 'A2', estado: 'ACTIVA', profundidadActual: 23, enAlerta: true },
  { idSonda: 'ACT-3', cuadrante: 'A3', estado: 'ACTIVA', profundidadActual: null, enAlerta: false },
];

test('filtro normal solo muestra dispositivos ACTIVOS con lectura normal', () => {
  assert.deepEqual(filtrarSondas(sondas, '', 'normal', 'all').map(s => s.idSonda), ['ACT-1']);
});

test('filtro todas conserva las retiradas para permitir consultar su historial', () => {
  assert.equal(filtrarSondas(sondas, '', 'all', 'all').length, sondas.length);
});

test('filtro RETIRADA permite encontrar la sonda histórica', () => {
  assert.deepEqual(filtrarSondas(sondas, '', 'all', 'RETIRADA').map(s => s.idSonda), ['RET-1']);
});

test('buscador sigue funcionando con mayúsculas y cuadrantes', () => {
  assert.deepEqual(filtrarSondas(sondas, 'b2', 'all', 'all').map(s => s.idSonda), ['RET-1']);
});

test('sin datos solo incluye sondas activas sin lectura', () => {
  assert.deepEqual(filtrarSondas(sondas, '', 'missing', 'all').map(s => s.idSonda), ['ACT-3']);
});

test('el filtro de alerta solo muestra sondas activas en alerta', () => {
  assert.deepEqual(filtrarSondas(sondas, '', 'alert', 'all').map(s => s.idSonda), ['ACT-2']);
});

test('condición y estado se cruzan sin reclasificar retiradas', () => {
  assert.deepEqual(filtrarSondas(sondas, '', 'normal', 'RETIRADA'), []);
  assert.deepEqual(filtrarSondas(sondas, '', 'all', 'RETIRADA').map(s => s.idSonda), ['RET-1']);
});

test('un valor firmado negativo es un dato válido bajo condición normal', () => {
  const negativas = [{ idSonda: 'NEG', cuadrante: 'N1', estado: 'ACTIVA', profundidadActual: -2, enAlerta: false }];
  assert.deepEqual(filtrarSondas(negativas, '', 'normal', 'all').map(s => s.idSonda), ['NEG']);
});

test('clasificación compartida preserva estados y distingue valores ausentes o no finitos', () => {
  for (const [estado, profundidadActual, enAlerta, esperado] of [
    ['ACTIVA', 0, false, 'normal'],
    ['ACTIVA', -2.35, false, 'normal'],
    ['ACTIVA', 25, true, 'alert'],
    ['ACTIVA', null, true, 'missing'],
    ['ACTIVA', NaN, false, 'missing'],
    ['ACTIVA', Infinity, true, 'missing'],
    ['RETIRADA', 25, true, 'inactive'],
    ['INACTIVA', 25, true, 'inactive'],
    ['MANTENIMIENTO', 25, true, 'inactive'],
  ]) {
    const sonda = { idSonda: 'TEST', cuadrante: 'QA', estado, profundidadActual, enAlerta };
    assert.equal(condicionSonda(sonda), esperado);
    for (const filtro of ['normal', 'alert', 'missing']) {
      assert.equal(filtrarSondas([sonda], '', filtro).length, filtro === esperado ? 1 : 0);
    }
  }
});
