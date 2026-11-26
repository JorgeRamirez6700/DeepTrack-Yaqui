import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { readSheet } from 'read-excel-file/node';

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
  const indicadores = page.getByRole('region', { name: 'Indicadores del periodo' });
  await expect(indicadores).toContainText('12.34 m');
  await expect(indicadores).toContainText('-14.69 m');
  const detalle = await (await page.request.get('/api/sondas/' + id)).json();
  expect(detalle.ultimaLecturaFechaHora).toBeTruthy();
  expect(detalle.vigenciaLectura).toBe('RECIENTE');
  await expect(page.getByRole('region', { name: 'Última medición' })).toContainText('Lectura reciente');
  await expect(page.locator('.recharts-line')).toBeVisible();
  const xlsxEvento = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar Excel', exact: true }).click();
  const xlsx = await xlsxEvento;
  expect(xlsx.suggestedFilename()).toMatch(/^DeepTrack-QA-E2E-DECIMAL-mes-.*\.xlsx$/);
  const archivoExcel = await xlsx.path();
  const filas = await readSheet(archivoExcel, 'Lecturas');
  expect(filas.slice(1).map(f => f[1])).toEqual([12.34, -2.35]);
  const resumenExcel = Object.fromEntries((await readSheet(archivoExcel, 'Resumen')).slice(1));
  expect(resumenExcel['Periodo seleccionado']).toBe('Último mes');
  expect(resumenExcel['Lecturas válidas']).toBe(2);
  expect(resumenExcel['Variación última - primera (m)']).toBeCloseTo(-14.69);
  const pdfEvento = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  const pdf = await pdfEvento;
  expect(pdf.suggestedFilename()).toMatch(/^DeepTrack-QA-E2E-DECIMAL-mes-.*\.pdf$/);
  const pdfContenido = (await readFile(await pdf.path())).toString('latin1');
  expect(pdfContenido.startsWith('%PDF-')).toBeTruthy();
  expect(pdfContenido).toContain('QA-E2E-DECIMAL');
  expect(pdfContenido).toContain('-14.69 m');
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

test('sonda sin mediciones y filtro de vigencia independiente', async ({ page }) => {
  await login(page);
  await abrirMapa(page);
  const id = 'QA-E2E-SIN-DATOS';
  await page.getByRole('button', { name: '+ Nueva', exact: true }).click();
  await page.locator('#s-id').fill(id);
  await page.locator('#s-cuadrante').fill('QA');
  await page.locator('#s-lat').fill('27.35');
  await page.locator('#s-lng').fill('-109.95');
  await guardar(page);
  await expect(fila(page, id)).toContainText('Sin mediciones');
  await page.getByRole('combobox', { name: 'Vigencia de la lectura', exact: true }).selectOption('SIN_DATOS');
  await expect(fila(page, id)).toBeVisible();
  await page.getByRole('combobox', { name: 'Condición (sondas activas)', exact: true }).selectOption('normal');
  await expect(fila(page, id)).toHaveCount(0);
  await page.getByRole('button', { name: 'Limpiar filtros' }).click();
  await fila(page, id).getByRole('button', { name: 'Ver tendencia' }).click();
  await expect(page.getByText('Sin lecturas válidas en el periodo seleccionado.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Exportar PDF', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Exportar Excel', exact: true })).toBeDisabled();
  await expect(page.getByRole('region', { name: 'Indicadores del periodo' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();

  // Respuesta controlada para el caso de vigencia atrasada; la regla de fecha
  // se prueba aparte en Java con reloj fijo y en el listado H2.
  const sondas = await (await page.request.get('/api/sondas')).json();
  const anterior = 'SN-YQ-012';
  const respuesta = sondas.map(s => s.idSonda === anterior
    ? { ...s, vigenciaLectura: 'ATRASADA', ultimaLecturaFechaHora: '2026-01-01T12:00:00' } : s);
  await page.route('**/api/sondas', route => route.fulfill({ json: respuesta }));
  await page.getByRole('button', { name: /Actualizar datos/ }).click();
  await expect(fila(page, anterior)).toContainText('Lectura atrasada');
  await page.getByRole('combobox', { name: 'Vigencia de la lectura', exact: true }).selectOption('ATRASADA');
  await expect(fila(page, anterior)).toBeVisible();
  await expect(fila(page, id)).toHaveCount(0);
});

test('análisis avanzado e intervalo individual con exportación personalizada', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Estadísticas', exact: true }).click();
  const panel = page.getByRole('region', { name: 'Análisis avanzado' });
  await expect(panel.getByRole('heading', { name: 'Estadísticas por cuadrante' })).toBeVisible();
  await panel.getByRole('checkbox', { name: /SN-YQ-012/ }).check();
  await panel.getByRole('checkbox', { name: /SN-YQ-045/ }).check();
  await panel.getByRole('button', { name: 'Aplicar análisis' }).click();
  const comparacion = panel.getByRole('region', { name: 'Comparación entre sondas' });
  await expect(comparacion.getByRole('row').filter({hasText:'SN-YQ-012'})).toBeVisible();
  await expect(comparacion.getByRole('row').filter({hasText:'SN-YQ-045'})).toBeVisible();
  await expect(comparacion.locator('.recharts-line')).toHaveCount(2);
  const respuesta = await page.request.get('/api/estadisticas/analisis?desde=2026-11-26&hasta=2100-01-01');
  expect(respuesta.status()).toBe(400);

  await abrirMapa(page);
  await fila(page, 'SN-YQ-012').getByRole('button', { name: 'Ver tendencia' }).click();
  const modal = page.getByRole('dialog');
  const desde = await modal.getByRole('textbox', {name:'Desde'}).count() ? modal.getByRole('textbox', {name:'Desde'}) : modal.getByLabel('Desde', {exact:true});
  const hasta = modal.getByLabel('Hasta', {exact:true});
  const fin = await hasta.inputValue();
  await desde.fill(fin);
  await modal.getByRole('button', {name:'Aplicar fechas'}).click();
  await expect(modal.getByText('Periodo aplicado: '+fin+' a '+fin)).toBeVisible();
  await expect(modal.getByRole('region',{name:'Indicadores del periodo'})).toBeVisible();
  const evento = page.waitForEvent('download');
  await modal.getByRole('button',{name:'Exportar Excel'}).click();
  const descarga = await evento;
  expect(descarga.suggestedFilename()).toContain('personalizado-'+fin+'_'+fin);
  const filas = await readSheet(await descarga.path(),'Lecturas');
  expect(filas.length).toBeGreaterThan(1);
  expect(filas.slice(1).every(r => r[0].startsWith(fin))).toBeTruthy();
});
