import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { hasStarted, type Appointment } from '@/entities/appointment'

/** Tope de `setTimeout` (~24,8 días): una cita más lejana se espera por tramos. */
const MAX_ESPERA_MS = 2_147_483_647

/**
 * `yaEmpezo`: true desde la hora de inicio de la cita (`hasStarted`). Pasa a
 * true sola al llegar esa hora, aunque el voucher siga abierto, para habilitar
 * Asistió / No asistió sin recargar (bloqueo antes de la hora, 2026-10-05).
 *
 * Reloj liviano: no hay intervalo, sino un único `setTimeout` programado para
 * `inicio` mientras `activo` sea true y la cita no haya empezado. Al dispararse
 * renueva "ahora"; si por un desfase todavía no empezó, se reprograma. Al volver
 * a la pestaña también se renueva (un equipo suspendido retrasa los timers).
 *
 * No reutiliza `useAhora` del dashboard: es de otro feature (FSD no permite
 * importarlo) y avanza por minuto, no a la hora exacta.
 */
export function useYaEmpezo(
  cita: Ref<Appointment | null>,
  activo: Ref<boolean>,
): { yaEmpezo: ComputedRef<boolean>; refrescar: () => void } {
  const ahora = ref(new Date())

  const yaEmpezo = computed(() => (cita.value ? hasStarted(cita.value, ahora.value) : false))

  function refrescar(): void {
    ahora.value = new Date()
  }

  function alVolverALaPestana(): void {
    if (document.visibilityState === 'visible') refrescar()
  }

  // Se re-evalúa al cambiar la cita, al abrir/cerrar y cada vez que se renueva
  // "ahora". El cleanup corre antes de cada re-evaluación y al desmontar.
  watch(
    [() => cita.value?.startsAt, activo, ahora],
    (_valores, _previos, onCleanup) => {
      if (!activo.value || !cita.value || yaEmpezo.value) return
      const espera = new Date(cita.value.startsAt).getTime() - Date.now()
      const timer = setTimeout(refrescar, Math.min(Math.max(espera, 0), MAX_ESPERA_MS))
      document.addEventListener('visibilitychange', alVolverALaPestana)
      onCleanup(() => {
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', alVolverALaPestana)
      })
    },
    { immediate: true },
  )

  return { yaEmpezo, refrescar }
}
