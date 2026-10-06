import { ref } from 'vue'
import { fechaEnClinicaISO, sumarDias } from '@/shared/lib/fecha'
import { FILTRO_POR_DEFECTO, inicioDeSemana, type FiltroEstado } from './agenda'

export type VistaAgenda = 'semana' | 'lista'

// Estado de la VISTA (qué modo, qué semana, qué rango, qué filtro). Vive a
// nivel de módulo para que ir a otra sección y volver deje la agenda como
// estaba, sin meter preferencias de interfaz en el store de datos
// (`useAgendaAppointments`), que solo guarda lo que se pidió y lo que llegó.
// Se pierde al recargar la página, igual que la sesión.
let estado: ReturnType<typeof crear> | null = null

function crear() {
  /** Hoy en la zona de la clínica: solo elige la semana inicial. */
  const hoy = fechaEnClinicaISO(new Date())
  const lunes = inicioDeSemana(hoy)
  return {
    vista: ref<VistaAgenda>('semana'),
    lunes: ref(lunes),
    desdeLista: ref(lunes),
    hastaLista: ref(sumarDias(lunes, 6)),
    // "Sin canceladas" por defecto (decisión del usuario, 2026-10-05).
    filtro: ref<FiltroEstado>(FILTRO_POR_DEFECTO),
  }
}

export function useVistaAgenda() {
  estado ??= crear()
  return estado
}
