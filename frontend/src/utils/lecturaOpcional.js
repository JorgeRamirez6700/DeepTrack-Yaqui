// No convertir NaN o Infinity silenciosamente en null al serializar JSON.
export function lecturaOpcional(estado, valor) {
  if (estado !== 'ACTIVA' || valor === '' || valor == null) return null;
  const lectura = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isFinite(lectura) || String(valor).trim() === '') {
    throw new Error('La lectura debe ser un número finito');
  }
  return lectura;
}
