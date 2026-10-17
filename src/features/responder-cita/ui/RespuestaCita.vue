<script setup lang="ts">
// Página del paciente `/cita#<token>` (Fase 3): ver su hora y responder desde
// el enlace del recordatorio. Pública, sin sesión, sin el layout del panel y
// pensada primero para el teléfono (el enlace llega por correo).
//
// Recibe el token ya leído del fragmento (lo lee y lo borra de la URL la
// página). Al montarse solo PIDE la vista: ninguna acción se ejecuta sin un
// clic. Sin token, ni siquiera llama a la API.
//
// Sin recursos de terceros: ni fuentes, ni analítica, ni imágenes externas
// (los íconos son SVG en línea y el logo, un PNG del propio sitio). Así el
// `Referer` y el token no salen de aquí.
import { nextTick, onMounted, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseLogo from '@/shared/ui/BaseLogo.vue'
import { useRespuestaCita } from '../model/useRespuestaCita'
import ResumenHora from './ResumenHora.vue'
import CancelarHoraForm from './CancelarHoraForm.vue'
import PedirOtraHoraForm from './PedirOtraHoraForm.vue'

const props = defineProps<{
  /** Token del enlace, o null si el fragmento no traía uno. Solo vive en memoria. */
  token: string | null
}>()

const {
  estado,
  cita,
  pantalla,
  aviso,
  errorCarga,
  enviando,
  errorAccion,
  cargar,
  confirmar,
  cancelar,
  pedirOtraHora,
  irA,
} = useRespuestaCita(props.token)

// ---------------------------------------------------------------------------
// Foco: al cambiar de pantalla por una acción del paciente, el foco va al
// título de la nueva (lector de pantalla y teclado no quedan en un botón que
// ya no existe). En la carga inicial no se mueve.
// ---------------------------------------------------------------------------

const tarjeta = ref<HTMLElement | null>(null)

async function enfocarTitulo(): Promise<void> {
  await nextTick()
  tarjeta.value?.querySelector<HTMLElement>('.respuesta-foco')?.focus()
}

watch(pantalla, () => void enfocarTitulo())
watch(estado, (nuevo, anterior) => {
  if (anterior !== 'cargando' && nuevo !== 'cargando') void enfocarTitulo()
})

onMounted(() => void cargar())
</script>

<template>
  <div class="respuesta">
    <header class="respuesta__marca">
      <BaseLogo :alto="34" />
    </header>

    <main class="respuesta__main">
      <section ref="tarjeta" class="respuesta__tarjeta" :aria-busy="estado === 'cargando'">
        <!-- Cargando -->
        <div v-if="estado === 'cargando'" class="respuesta__esqueleto" aria-label="Cargando tu hora">
          <span class="respuesta__skel respuesta__skel--corto" />
          <span class="respuesta__skel respuesta__skel--titulo" />
          <span class="respuesta__skel respuesta__skel--medio" />
          <span class="respuesta__skel respuesta__skel--largo" />
          <span class="respuesta__skel respuesta__skel--boton" />
        </div>

        <!-- Enlace no válido: sin token o 404, siempre la misma pantalla -->
        <div v-else-if="estado === 'invalido'" class="respuesta__estado">
          <span class="respuesta__icono respuesta__icono--neutro" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
              <path d="m3 3 18 18" />
            </svg>
          </span>
          <h1 class="respuesta__titulo respuesta-foco" tabindex="-1">
            Este enlace no es válido o ya venció
          </h1>
          <p class="respuesta__texto">
            Ábrelo de nuevo desde el último correo de recordatorio que recibiste. Si necesitas hacer
            un cambio en tu hora, contacta directamente a tu profesional.
          </p>
        </div>

        <!-- No se pudo cargar (red, 429, 5xx) -->
        <div v-else-if="estado === 'error'" class="respuesta__estado" role="alert">
          <span class="respuesta__icono respuesta__icono--alerta" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16.5v.5" />
            </svg>
          </span>
          <h1 class="respuesta__titulo respuesta-foco" tabindex="-1">No pudimos cargar tu hora</h1>
          <p class="respuesta__texto">{{ errorCarga }}</p>
          <BaseButton @click="cargar">Reintentar</BaseButton>
        </div>

        <!-- Hay hora -->
        <template v-else-if="cita">
          <ResumenHora
            v-if="pantalla === 'resumen'"
            :cita="cita"
            :aviso="aviso"
            :enviando="enviando"
            :error-accion="errorAccion"
            @confirmar="confirmar"
            @cancelar="irA('cancelar')"
            @otra-hora="irA('otraHora')"
          />
          <CancelarHoraForm
            v-else-if="pantalla === 'cancelar'"
            :cita="cita"
            :enviando="enviando === 'cancelar'"
            :error="errorAccion"
            @volver="irA('resumen')"
            @enviar="cancelar"
          />
          <PedirOtraHoraForm
            v-else
            :cita="cita"
            :enviando="enviando === 'pedirOtraHora'"
            :error="errorAccion"
            @volver="irA('resumen')"
            @enviar="pedirOtraHora($event.preferencia, $event.motivo)"
          />
        </template>
      </section>

      <p class="respuesta__pie">
        Este enlace es personal: no lo reenvíes. Citia gestiona las horas de tu profesional.
      </p>
    </main>
  </div>
</template>

<style scoped>
/* Móvil primero: la tarjeta ocupa el ancho con 1rem de margen; desde 640px se
   centra con un ancho máximo. Mismo azul de marca que /agendar-cita. */
.respuesta {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1.25rem 1rem 2rem;
  background: var(--color-primary);
  color: #fff;
}
.respuesta__marca {
  display: flex;
  align-items: center;
}
.respuesta__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding-top: 1.25rem;
}
.respuesta__tarjeta {
  width: 100%;
  max-width: 480px;
  padding: 1.5rem 1.25rem;
  color: var(--color-text);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
}
.respuesta__pie {
  max-width: 480px;
  margin: 0;
  font-size: 0.8rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}
.respuesta__estado {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.85rem;
}
.respuesta__icono {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
}
.respuesta__icono--neutro {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}
.respuesta__icono--alerta {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
.respuesta__titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text);
}
.respuesta__titulo:focus {
  outline: none;
}
.respuesta__texto {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.respuesta__esqueleto {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.respuesta__skel {
  display: block;
  height: 0.9rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: respuesta-pulso 1.2s ease-in-out infinite;
}
.respuesta__skel--corto {
  width: 30%;
}
.respuesta__skel--titulo {
  width: 85%;
  height: 1.6rem;
}
.respuesta__skel--medio {
  width: 55%;
}
.respuesta__skel--largo {
  width: 70%;
}
.respuesta__skel--boton {
  width: 100%;
  height: 2.9rem;
  margin-top: 0.5rem;
  border-radius: var(--radius-md);
}
@keyframes respuesta-pulso {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@media (prefers-reduced-motion: reduce) {
  .respuesta__skel {
    animation: none;
  }
}
@media (min-width: 640px) {
  .respuesta {
    padding: 2rem 3rem 2.5rem;
  }
  .respuesta__main {
    justify-content: center;
    padding-top: 0;
  }
  .respuesta__tarjeta {
    padding: 2rem;
  }
}
</style>
