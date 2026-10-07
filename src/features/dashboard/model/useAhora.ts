import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * "Ahora" que avanza solo cada `intervaloMs` (por defecto, un minuto) mientras
 * el componente está montado. Lo usa "Próxima cita": si el dashboard queda
 * abierto, la tarjeta pasa a la siguiente cita sin esperar una recarga.
 */
export function useAhora(intervaloMs = 60_000): Ref<Date> {
  const ahora = ref(new Date())
  let timer: ReturnType<typeof setInterval> | undefined

  onMounted(() => {
    timer = setInterval(() => {
      ahora.value = new Date()
    }, intervaloMs)
  })
  onBeforeUnmount(() => clearInterval(timer))

  return ahora
}
