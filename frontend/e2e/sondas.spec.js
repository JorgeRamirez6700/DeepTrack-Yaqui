import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

async function login(page, usuario = 'admin', password = 'admin123') {
  await page.goto('/');
  await page.getByLabel('Usuario', { exact: true }).fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
}

async function abrirMapa(page) {
  await page.getByRole('button', { name: 'Mapa de pozos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mapa de pozos' })).toBeVisible();
  await expect(page.locator('.sonda-row').first()).toBeVisible();
}
const fila = (page, id) => page.locator('.sonda-row').filter({ has: page.getByText(id, { exact: true }) });
const guardar = page => page.getByRole('button', { name: 'Guardar sonda', exact: true }).click();
const leerHistorico = async (page, id) => {
  const res = await page.request.get('/api/sondas/' + id + '/historico?rango=mes');
  expect(res.ok()).toBeTruthy();
  return (await res.json()).map(l => l.profundidadM);
};

test('flujo real: decimales, CSV, filtros, retiro y reactivación sin pérdida de histórico', async ({ page }) => {
  const errores = [];
  page.on('pageerror', error => errores.push(error.message));
  await login(page);
  await abrirMapa(page);
  await expect(page.getByText('Falta la API Key de Google Maps.', { exact: false })).toBeVisible();
  const id = 'QA-E2E-DECIMAL';
  await page.getByRole('button', { name: '+ Nueva', exact: true }).click();
  await page.locator('#s-id').fill(id);
  await page.locator('#s-cuadrante').fill('QA');
  await page.locator('#s-lat').fill('27.35');
  await page.locator('#s-lng').fill('-109.95');
  await page.locator('#s-prof').fill('12.34');
  await guardar(page);
  await expect(fila(page, id)).toContainText('12.34 m');

  await fila(page, id).getByRole('button', { name: 'Editar', exact: true }).click();
  await page.locator('#s-prof').fill('-2.35');
  await guardar(page);
  await expect(fila(page, id)).toContainText('-2.35 m');
  expect(await leerHistorico(page, id)).toEqual([12.34, -2.35]);

  // Editar metadatos sin modificar una lectura decimal no crea un duplicado.
  await fila(page, id).getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.locator('#s-prof')).toHaveValue('-2.35');
  await page.locator('#s-cuadrante').fill('QA1');
  await guardar(page);
  await expect(fila(page, id)).toContainText('QA1');
  expect(await leerHistorico(page, id)).toEqual([12.34, -2.35]);

  await page.getByRole('button', { name: 'Reportes', exact: true }).click();
  await expect(page.locator('tr').filter({ hasText: id })).toContainText('-2.35 m');
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar CSV (Excel)', exact: true }).click();
  const archivo = await descarga;
  const csv = await readFile(await archivo.path(), 'utf8');
  const linea = csv.split(/\r?\n/).find(l => l.startsWith('"' + id + '",'));
  expect(linea).toBeDefined();
  expect(linea.split(',').slice(-2)).toEqual(['-2.35', '12.34']);

  await abrirMapa(page);
  await fila(page, id).getByRole('button', { name: 'Ver tendencia' }).click();
  await expect(page.getByRole('dialog')).toContainText('-2.35 m');
  await expect(page.locator('.recharts-line')).toBeVisible();
  await page.getByRole('button', { name: 'Último año', exact: true }).click();
  await expect(page.locator('.recharts-line')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

  page.once('dialog', d => d.accept());
  await fila(page, id).getByRole('button', { name: 'Retirar', exact: true }).click();
  await expect(fila(page, id)).toContainText('RETIRADA');
  await page.getByLabel('Condición (sondas activas)').selectOption('normal');
  await expect(fila(page, id)).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await page.getByRole('combobox', { name: 'Estado', exact: true }).selectOption('RETIRADA');
  await expect(fila(page, id)).toBeVisible();
  await fila(page, id).getByRole('button', { name: 'Editar', exact: true }).click();
  await expect(page.locator('#s-prof')).toBeDisabled();
  await page.locator('#s-cuadrante').fill('QA2');
  await guardar(page);
  await expect(fila(page, id)).toContainText('QA2');
  await expect(fila(page, id)).toContainText('RETIRADA');
  expect(await leerHistorico(page, id)).toEqual([12.34, -2.35]);

  await fila(page, id).getByRole('button', { name: 'Editar', exact: true }).click();
  await page.locator('#s-estado').selectOption('ACTIVA');
  await guardar(page);
  await expect(fila(page, id)).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await expect(fila(page, id)).toContainText('ACTIVA');
  expect(await leerHistorico(page, id)).toEqual([12.34, -2.35]);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  expect(errores).toEqual([]);
});

test('una consulta retrasada no deshace una edición posterior', async ({ page }) => {
  await login(page);
  await abrirMapa(page);
  const id = 'SN-YQ-012';
  const previo = await (await page.request.get('/api/sondas')).json();
  let liberar, interceptada;
  const espera = new Promise(resolve => { liberar = resolve; });
  const iniciada = new Promise(resolve => { interceptada = resolve; });
  let primera = true;
  await page.route('**/api/sondas', async route => {
    if (route.request().method() !== 'GET' || !primera) return route.continue();
    primera = false;
    interceptada();
    await espera;
    await route.fulfill({ json: previo });
  });
  try {
    await page.getByRole('button', { name: /Actualizar datos/ }).click();
    await iniciada;
    await fila(page, id).getByRole('button', { name: 'Editar', exact: true }).click();
    await page.locator('#s-cuadrante').fill('QARACE');
    await guardar(page);
    await expect(fila(page, id)).toContainText('QARACE');
    const antigua = page.waitForResponse(r => r.url().endsWith('/api/sondas') && r.request().method() === 'GET');
    liberar();
    await (await antigua).finished();
    // Esperar procesamiento de respuesta y render, no solo recepción de headers.
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 250)));
    await expect(fila(page, id)).toContainText('QARACE');
  } finally {
    liberar();
    await page.unrouteAll({ behavior: 'wait' });
  }
});

test('analista no puede acceder a gestión de usuarios', async ({ page }) => {
  await login(page, 'analista', 'analista123');
  await expect(page.getByRole('button', { name: 'Usuarios', exact: true })).toHaveCount(0);
  expect((await page.request.get('/api/usuarios')).status()).toBe(403);
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toBeVisible();
  expect((await page.request.get('/api/sondas')).status()).toBe(401);
});
