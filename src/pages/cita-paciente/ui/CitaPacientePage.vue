<script setup lang="ts">
// Página pública `/cita#<token>` (Fase 3): el paciente responde a su hora desde
// el enlace del recordatorio. Standalone, sin sidebar ni sesión, como
// `/agendar-cita/:tenantSlug`.
//
// Lo único que hace la página es la parte de rutas: leer el token del
// fragmento y sacarlo de la URL. El token se queda solo en memoria (se pasa
// como prop al feature), así no queda en la barra de direcciones, en el
// historial ni en una captura de pantalla.
//
// El fragmento se borra con `router.replace` y no con un
// `history.replaceState` a mano: vue-router hace ese mismo `replaceState`,
// pero además actualiza su estado interno. Con uno a mano, vue-router seguiría
// recordando la URL con `#<token>` y la volvería a escribir en el historial en
// la siguiente navegación.
//
// **Un fragmento nuevo con la página ya abierta** (el paciente toca el enlace
// de otro correo y el navegador reutiliza la pestaña: navegación del mismo
// documento, sin recarga): vue-router no vuelve a montar la página, solo cambia
// `route.hash`. Se vigila ese cambio y se trata igual que al abrir: se lee el
// token nuevo, se borra de la URL y el feature se vuelve a montar desde cero
// (`:key`), así no queda nada de la cita anterior (formulario abierto, avisos,
// la vista misma) y lo único que se hace es el GET de la nueva. Nunca un POST.
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RespuestaCita, tokenDesdeFragmento } from '@/features/responder-cita'

const route = useRoute()
const router = useRouter()
/** La ruta de esta página: el watch no actúa si la navegación ya va hacia otra. */
const rutaPropia = route.name

/** Token del enlace vigente en esta pestaña, solo en memoria. */
const token = ref<string | null>(null)
/** Cambia con cada fragmento leído: fuerza un montaje nuevo del feature. */
const montaje = ref(0)

/**
 * Toma el token de un fragmento y lo borra de la URL. Un fragmento vacío no
 * cambia nada: es el que deja el propio `router.replace` de aquí.
 */
function tomarFragmento(fragmento: string): void {
  if (!fragmento || route.name !== rutaPropia) return
  token.value = tokenDesdeFragmento(fragmento)
  montaje.value += 1
  void router.replace({ path: route.path, query: route.query, hash: '' })
}

tomarFragmento(route.hash)

watch(
  () => route.hash,
  (fragmento) => tomarFragmento(fragmento),
)
</script>

<template>
  <RespuestaCita :key="montaje" :token="token" />
</template>
