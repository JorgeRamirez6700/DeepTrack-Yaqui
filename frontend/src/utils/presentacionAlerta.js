import { condicionSonda } from './filtrarSondas.js';

const PRESENTACION = {
  inactive: { clase: 'unknown', texto: 'No aplica', color: '#81939b' },
  missing: { clase: 'unknown', texto: 'Sin datos', color: '#81939b' },
  normal: { clase: 'ok', texto: 'Normal', color: '#2E6E7E' },
  warning: { clase: 'warning', texto: 'Advertencia', color: '#B98729' },
  alert: { clase: 'alert', texto: 'Crítica', color: '#B5502E' },
  unassessed: { clase: 'unknown', texto: 'Sin evaluar', color: '#81939b' },
};

export function presentacionAlerta(sonda) {
  const condicion = condicionSonda(sonda);
  const p = PRESENTACION[condicion];
  return { ...p, texto: condicion === 'inactive' ? sonda.estado : p.texto };
}
