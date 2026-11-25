// Los números finitos son datos numéricos, no fórmulas.
// Se mantiene la protección de texto controlado por usuarios (IDs, cuadrantes).
export function csvCell(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
