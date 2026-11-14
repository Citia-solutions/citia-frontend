<script setup lang="ts">
// Página pública `/terminos` (US-11): términos de uso y aviso de privacidad de
// Citia para pacientes, versión `VERSION_TERMINOS_PACIENTE`.
//
// El texto es el de `citia-backend/context/US/11-terminos-paciente.md`
// (§ El texto que se publica) **palabra por palabra**; su copia congelada vive en
// `citia-backend/context/Cumplimiento/`. Cambiar una sola palabra es publicar una
// versión nueva: texto, `VERSION_TERMINOS_PACIENTE` y `FECHA_TERMINOS_PACIENTE`
// juntos (`shared/config/terminosPaciente.ts`), y el catálogo del backend antes.
//
// Pública: sin sesión, sin el layout del panel, sin llamadas a la API y sin
// recursos de terceros (ni fuentes, ni analítica, ni imágenes externas: el logo
// es un PNG del propio sitio). Se abre en otra pestaña desde el formulario de
// `/agendar-cita` y desde `/cita`, y el profesional se la da al paciente en el
// alta manual. Es genérica («tu profesional»): no sabe de qué organización viene
// quien la lee (D2 de ADR-16).
import BaseLogo from '@/shared/ui/BaseLogo.vue'
import {
  FECHA_TERMINOS_PACIENTE,
  VERSION_TERMINOS_PACIENTE,
} from '@/shared/config/terminosPaciente'
import { fechaCalendario, formatearFecha } from '@/shared/lib/fecha'

/** '14 de noviembre de 2026'. */
const fechaPublicacion = formatearFecha(fechaCalendario(FECHA_TERMINOS_PACIENTE), {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const CORREO_SOPORTE = 'soporte@citiahealth.cl'
</script>

<template>
  <div class="terminos">
    <header class="terminos__marca">
      <BaseLogo :alto="30" />
    </header>

    <main class="terminos__main">
      <article class="terminos__documento" aria-labelledby="terminos-titulo">
        <h1 id="terminos-titulo" class="terminos__titulo">
          Términos de uso y aviso de privacidad de Citia para pacientes
        </h1>
        <p class="terminos__version">
          Versión {{ VERSION_TERMINOS_PACIENTE }} · publicada el {{ fechaPublicacion }}
        </p>

        <section class="terminos__seccion" aria-labelledby="terminos-1">
          <h2 id="terminos-1" class="terminos__subtitulo">1. Quién es quién</h2>
          <ul class="terminos__lista">
            <li>
              <strong>Tu profesional</strong> es la persona o la clínica que agenda tus horas con
              Citia: la que te compartió el enlace para pedir hora o la que te envía los
              recordatorios. Su nombre aparece en la página de tu hora y en los recordatorios. Tu
              profesional decide para qué se usan tus datos.
            </li>
            <li>
              <strong>Citia</strong> es el sistema de agenda que usa tu profesional. Trata tus datos
              <strong>por encargo de tu profesional</strong> y solo para lo que se describe aquí.
              Citia no usa tus datos para fines propios, no los vende y no los comparte con otros
              profesionales o clínicas que usen Citia.
            </li>
          </ul>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-2">
          <h2 id="terminos-2" class="terminos__subtitulo">2. Qué datos se usan</h2>
          <ul class="terminos__lista">
            <li>
              <strong>Para identificarte y contactarte:</strong> tu nombre, tu RUT, tu teléfono y tu
              correo.
            </li>
            <li>
              <strong>De tus horas:</strong> la fecha y la duración, el tipo o motivo de la
              consulta, su estado (pendiente, confirmada, cancelada, si asististe o no) y los
              cambios que tuvo, incluido quién pidió reagendar o cancelar. Si no confirmas una hora
              y no se registra tu asistencia, al terminar el día el sistema la marca sola como
              inasistencia.
            </li>
            <li>
              <strong>Si pides hora por el enlace público:</strong> además, tu preferencia de
              horario y el motivo que escribas.
            </li>
            <li>
              <strong>Del enlace de tu hora:</strong> cuándo lo abriste por primera vez y lo que
              hiciste ahí (confirmar, cancelar o pedir otra hora).
            </li>
            <li>
              <strong>De los correos:</strong> si los recordatorios se entregaron o rebotaron.
            </li>
            <li>
              <strong>De tu autorización:</strong> qué versión de estos términos aceptaste, cuándo y
              por dónde (el formulario para pedir hora, el enlace de tu hora o tu profesional).
            </li>
          </ul>
          <p class="terminos__parrafo">
            <strong>
              El motivo de la consulta y tu asistencia pueden revelar información sobre tu salud.
            </strong>
            Se usan solo para gestionar tus horas.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-3">
          <h2 id="terminos-3" class="terminos__subtitulo">3. Para qué se usan</h2>
          <ul class="terminos__lista">
            <li>Agendar, reagendar y cancelar tus horas.</li>
            <li>
              Enviarte recordatorios por correo, con un enlace para confirmar, cancelar o pedir otra
              hora.
            </li>
            <li>Que tu profesional lleve el registro de asistencia de su agenda.</li>
          </ul>
          <p class="terminos__parrafo">
            <strong>No se usan</strong> para publicidad, ni para calificarte o hacer un perfil tuyo.
            Si algún día tu historial de asistencia se quisiera usar para otra cosa, se te pedirá una
            autorización nueva.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-4">
          <h2 id="terminos-4" class="terminos__subtitulo">4. Tu autorización</h2>
          <p class="terminos__parrafo">
            Al marcar la casilla o presionar «Acepto» autorizas a tu profesional, y a Citia como su
            proveedor, a usar tus datos (incluido el motivo de tu consulta) para lo que dice el punto
            3. Puedes retirar tu autorización cuando quieras escribiéndole a tu profesional.
            Retirarla no deshace lo anterior, y sin tus datos de contacto no se te pueden enviar
            recordatorios.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-5">
          <h2 id="terminos-5" class="terminos__subtitulo">5. Con quién se comparten</h2>
          <ul class="terminos__lista">
            <li>Con tu profesional.</li>
            <li>
              Con los proveedores que Citia necesita para funcionar: alojamiento del sistema y de la
              base de datos (Railway), envío de correos (Resend) y publicación del sitio web
              (Netlify). Algunos procesan datos <strong>fuera de Chile</strong>, principalmente en
              Estados Unidos. Son proveedores: no usan tus datos para sí mismos.
            </li>
            <li>
              <strong>No</strong> se comparten con otros profesionales o clínicas que usen Citia.
            </li>
          </ul>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-6">
          <h2 id="terminos-6" class="terminos__subtitulo">6. Cuánto tiempo se guardan</h2>
          <p class="terminos__parrafo">
            Mientras tu profesional use Citia y los necesite para atenderte. Si tu profesional deja
            de usar Citia, tus datos se le devuelven o se eliminan.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-7">
          <h2 id="terminos-7" class="terminos__subtitulo">7. Tus derechos</h2>
          <p class="terminos__parrafo">Puedes pedir:</p>
          <ul class="terminos__lista">
            <li>saber qué datos tuyos hay;</li>
            <li>corregirlos;</li>
            <li>que se eliminen;</li>
            <li>oponerte a un uso;</li>
            <li>una copia para llevarlos a otro lugar.</li>
          </ul>
          <p class="terminos__parrafo">
            Escríbele a tu profesional, por el medio que usas para comunicarte con él o ella, o a
            <a class="terminos__enlace" :href="`mailto:${CORREO_SOPORTE}`">{{ CORREO_SOPORTE }}</a>,
            indicando tu nombre y RUT. Te responderemos dentro de 30 días.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-8">
          <h2 id="terminos-8" class="terminos__subtitulo">8. Si el paciente es menor de edad</h2>
          <p class="terminos__parrafo">
            Si tienes menos de 16 años, la autorización la da tu madre, tu padre o quien te
            represente legalmente.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-9">
          <h2 id="terminos-9" class="terminos__subtitulo">9. Seguridad</h2>
          <p class="terminos__parrafo">
            Las conexiones van cifradas. Solo tu profesional accede a tus datos, con su cuenta, y
            cada consulta que usa Citia tiene sus datos separados de las demás. El enlace de tu hora
            es personal: no lo compartas.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-10">
          <h2 id="terminos-10" class="terminos__subtitulo">10. Cambios a estos términos</h2>
          <p class="terminos__parrafo">
            Si cambian, publicaremos la nueva versión con su fecha en esta página. Si el cambio es
            para un uso nuevo de tus datos, te pediremos una autorización nueva.
          </p>
        </section>

        <section class="terminos__seccion" aria-labelledby="terminos-11">
          <h2 id="terminos-11" class="terminos__subtitulo">11. Contacto</h2>
          <p class="terminos__parrafo">
            Tu profesional, por el medio que usas para comunicarte con él o ella · Citia:
            <a class="terminos__enlace" :href="`mailto:${CORREO_SOPORTE}`">{{ CORREO_SOPORTE }}</a>
          </p>
        </section>
      </article>
    </main>
  </div>
</template>

<style scoped>
/* Móvil primero, como /cita: banda azul de marca con el logo y el texto en una
   hoja blanca; desde 720 px la hoja se centra con un ancho de lectura. */
.terminos {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}
.terminos__marca {
  display: flex;
  align-items: center;
  padding: 1.1rem 1rem;
  background: var(--color-primary);
}
.terminos__main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 1rem 0.75rem 2.5rem;
}
.terminos__documento {
  width: 100%;
  max-width: 760px;
  padding: 1.5rem 1.25rem 2rem;
  color: var(--color-text);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  font-size: 1rem;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.terminos__titulo {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-text);
}
.terminos__version {
  margin: 0.5rem 0 0;
  font-size: 0.9rem;
  font-style: italic;
  color: var(--color-text-muted);
}
.terminos__seccion {
  margin-top: 1.6rem;
}
.terminos__subtitulo {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--color-text);
}
.terminos__parrafo {
  margin: 0.6rem 0 0;
}
.terminos__subtitulo + .terminos__parrafo {
  margin-top: 0;
}
.terminos__lista {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.terminos__enlace {
  color: var(--color-primary);
  font-weight: 600;
}
.terminos__enlace:hover {
  color: var(--color-primary-strong);
}
.terminos__enlace:focus-visible {
  outline: 2px solid var(--color-primary-strong);
  outline-offset: 2px;
  border-radius: 2px;
}
@media (min-width: 720px) {
  .terminos__marca {
    padding: 1.25rem 3rem;
  }
  .terminos__main {
    padding: 2rem 1.5rem 3rem;
  }
  .terminos__documento {
    padding: 2.5rem 3rem 3rem;
  }
  .terminos__titulo {
    font-size: 1.75rem;
  }
}
</style>
