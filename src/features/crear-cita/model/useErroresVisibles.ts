import { computed, reactive, type ComputedRef } from 'vue'
import { validarPaso, type FlujoCitaField, type FlujoCitaForm, type FlujoCitaPaso } from './flujoCitaModel'

/**
 * Errores "visibles" por campo para el formulario público.
 *
 * La validación completa vive en `validarPaso` y solo corre al intentar
 * avanzar. Para que el usuario vea el mensaje sin tener que pulsar Continuar,
 * cada campo se marca como "tocado" (al salir del campo, al cambiar, o al
 * entrar al paso) y desde ese momento su error se muestra y se recalcula en
 * vivo mientras se escribe.
 *
 * Reusa `validarPaso`, así las reglas y textos no se duplican.
 */
export function useErroresVisibles(paso: FlujoCitaPaso, form: FlujoCitaForm) {
  const tocados = reactive<Record<FlujoCitaField, boolean>>({
    rut: false,
    nombre: false,
    apellidos: false,
    correo: false,
    telefono: false,
    fecha: false,
    hora: false,
    motivo: false,
    consentimiento: false,
  })

  function marcarTocado(campo: FlujoCitaField): void {
    tocados[campo] = true
  }

  /** Marca como tocados todos los campos del paso (ej. al entrar a Horario). */
  function marcarPasoTocado(campos: FlujoCitaField[]): void {
    for (const campo of campos) tocados[campo] = true
  }

  /** Error visible del campo: solo si está tocado, recalculado en vivo. */
  function errorDe(campo: FlujoCitaField): ComputedRef<string | undefined> {
    return computed(() => {
      if (!tocados[campo]) return undefined
      return validarPaso(form, paso)[campo]
    })
  }

  return { marcarTocado, marcarPasoTocado, errorDe }
}
