/** Solo la última petición iniciada puede modificar el estado del panel. */
export function crearCargaVigente({ consultar, alInicio, alExito, alError, alFinal }) {
  let vigente = 0;
  return {
    async ejecutar() {
      const id = ++vigente;
      alInicio();
      try {
        const datos = await consultar();
        if (id === vigente) alExito(datos);
      } catch (error) {
        if (id === vigente) alError(error);
      } finally {
        if (id === vigente) alFinal();
      }
    },
    invalidar() { vigente++; },
  };
}
