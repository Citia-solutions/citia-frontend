import type { App } from 'vue'
import { createPinia } from 'pinia'
import { router } from '@/app/router'

/** Registra los plugins globales de la app. Pinia primero, luego el router. */
export function registerProviders(app: App): void {
  app.use(createPinia())
  app.use(router)
}
