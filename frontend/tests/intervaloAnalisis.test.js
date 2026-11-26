import test from 'node:test';
import assert from 'node:assert/strict';
import { validarIntervalo, puntosComparacion } from '../src/utils/intervaloAnalisis.js';

test('intervalos incluyen ambos días, rechazan futuro y máximo excedido', () => {
  const hoy = '2026-11-26';
  assert.equal(validarIntervalo({desde:hoy,hasta:hoy}, hoy), '');
  assert.equal(validarIntervalo({desde:'2025-11-26',hasta:hoy}, hoy), '');
  for (const fechas of [
    {desde:'2025-11-25',hasta:hoy}, {desde:hoy,hasta:'2026-11-27'},
    {desde:'2026-11-27',hasta:hoy}, {desde:'2026-02-30',hasta:hoy}
  ]) assert.notEqual(validarIntervalo(fechas,hoy), '');
});
test('comparación alinea días por fecha y conserva negativos, cero y huecos', () => {
  const a='2026-11-25', b='2026-11-26';
  assert.deepEqual(puntosComparacion([
    {dias:[{fecha:a,promedioM:-2},{fecha:b,promedioM:null}]},
    {dias:[{fecha:a,promedioM:0},{fecha:b,promedioM:4}]}
  ]), [{fecha:a,s0:-2,s1:0},{fecha:b,s0:null,s1:4}]);
});
