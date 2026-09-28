// API pública del feature `agenda` (cierre de Fase 1 de US-02): vista semanal
// y lista por rango de la agenda del profesional.
export { default as AgendaProfesional } from './ui/AgendaProfesional.vue'
export {
  inicioDeSemana,
  diasDeSemana,
  validarRango,
  aplicarFiltro,
  agruparPorFecha,
  distribuirEnCarriles,
  type FiltroEstado,
  type BloqueAgenda,
} from './model/agenda'
