import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lecturaOpcional } from '../src/utils/lecturaOpcional.js';
import { crearCargaVigente } from '../src/utils/cargaVigente.js';
import { csvCell } from '../src/utils/csvCell.js';

test('formulario conserva precisión y signo, y permite omitir lectura', () => {
  assert.equal(lecturaOpcional('ACTIVA', '12.34'), 12.34);
  assert.equal(lecturaOpcional('ACTIVA', '-2.35'), -2.35);
  assert.equal(lecturaOpcional('ACTIVA', 0), 0);
  assert.equal(lecturaOpcional('ACTIVA', ''), null);
  assert.equal(lecturaOpcional('RETIRADA', '12.34'), null);
  const formulario = readFileSync(new URL('../src/components/SondaForm.jsx', import.meta.url), 'utf8');
  assert.match(formulario, /id="s-prof"[^>]*step="any"/);
});

test('lectura no finita o texto inválido nunca se serializa como null', () => {
  for (const valor of [NaN, Infinity, -Infinity, '1e400', 'abc', ' ']) {
    assert.throws(() => lecturaOpcional('ACTIVA', valor), /finito/);
  }
});

function diferida() {
  let resolve, reject;
  const promise = new Promise((ok, error) => { resolve = ok; reject = error; });
  return { promise, resolve, reject };
}
function escenario() {
  const pendientes = [];
  const estado = { datos: null, error: '', cargando: false, revision: 0 };
  const carga = crearCargaVigente({
    consultar() { const p = diferida(); pendientes.push(p); return p.promise; },
    alInicio() { estado.cargando = true; },
    alExito(datos) { estado.datos = datos; estado.error = ''; estado.revision++; },
    alError(error) { estado.error = error.message; },
    alFinal() { estado.cargando = false; },
  });
  return { carga, pendientes, estado };
}
test('la respuesta antigua no sobrescribe los datos nuevos', async () => {
  const { carga, pendientes, estado } = escenario();
  const a = carga.ejecutar(), b = carga.ejecutar();
  pendientes[1].resolve('RETIRADA'); await b;
  pendientes[0].resolve('ACTIVA'); await a;
  assert.deepEqual(estado, { datos: 'RETIRADA', error: '', cargando: false, revision: 1 });
});
test('un error antiguo no termina la carga vigente', async () => {
  const { carga, pendientes, estado } = escenario();
  const a = carga.ejecutar(), b = carga.ejecutar();
  pendientes[0].reject(new Error('Error antiguo')); await a;
  assert.equal(estado.cargando, true);
  assert.equal(estado.error, '');
  pendientes[1].resolve('ACTIVA'); await b;
  assert.equal(estado.cargando, false);
  assert.equal(estado.datos, 'ACTIVA');
});
test('el error vigente se conserva frente a un éxito antiguo', async () => {
  const { carga, pendientes, estado } = escenario();
  const a = carga.ejecutar(), b = carga.ejecutar();
  pendientes[1].reject(new Error('Error vigente')); await b;
  pendientes[0].resolve('ACTIVA'); await a;
  assert.equal(estado.error, 'Error vigente');
  assert.equal(estado.datos, null);
  assert.equal(estado.revision, 0);
});
test('invalidar al desmontar impide aplicar respuestas pendientes', async () => {
  const { carga, pendientes, estado } = escenario();
  const a = carga.ejecutar();
  carga.invalidar();
  pendientes[0].resolve('ACTIVA'); await a;
  assert.equal(estado.datos, null);
  assert.equal(estado.revision, 0);
});
test('CSV conserva negativos numéricos y protege texto con prefijo de fórmula', () => {
  assert.equal(csvCell(-12.34), '-12.34');
  assert.equal(csvCell(0), '0');
  assert.equal(csvCell(null), '""');
  assert.equal(csvCell('-12.34'), '"\'-12.34"');
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.equal(csvCell('A"B'), '"A""B"');
});
