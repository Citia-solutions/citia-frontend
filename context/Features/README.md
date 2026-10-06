# Índice de Features — Frontend

Cada feature documenta una funcionalidad implementada: qué hace, el contrato con el backend, las
decisiones propias del front y sus pendientes. Misma convención que el backend.

| Feature | Estado | Rama / commits |
|---------|--------|----------------|
| [agendar-cita-paciente](agendar-cita-paciente.md) | ✅ Implementado y conectado | `feature/agendar-cita-paciente` · `e18c34c`, `1980990` |
| [dashboard-citas-del-dia](dashboard-citas-del-dia.md) — US-06 + subtarea US-02.09 · lote 2: cuatro tarjetas reales, citas por semana, recordatorios, canceladas ocultas | ✅ Implementado y conectado, **sin datos de prueba** · ⚠️ sin prueba manual contra el backend | `feature/us02-voucher-dashboard` · lote 2 en `feature/frontend-prerelease`, sin commit |
| [gestionar-cita](gestionar-cita.md) — voucher, subtarea US-02.08 · Fase 2: estado de recordatorios y editar contacto · lote 2: confirmar, asistió, no asistió | ✅ Implementado y conectado · ⚠️ sin prueba manual contra el backend | `feature/us02-voucher-dashboard` · Fase 2 en `feature/fase2-recordatorios` · lote 2 en `feature/frontend-prerelease`, sin commit |
| [agenda-profesional](agenda-profesional.md) — cierre de Fase 1 US-02: agenda semanal + lista, aviso de solapamiento (ADR-11), layout del panel · lote 2: "Sin canceladas" por defecto, canceladas sin carril, recarga al entrar | ✅ Implementado · ⚠️ solo con respuestas simuladas | `feature/us02-cierre-fase1` · lote 2 en `feature/frontend-prerelease`, sin commit |
| [bandeja-solicitudes](bandeja-solicitudes.md) — cierre de Fase 1 US-02: bandeja (listar, aceptar, rechazar) + enlace de agenda | ✅ Implementado · ⚠️ solo con respuestas simuladas (backend en paralelo) | `feature/us02-cierre-fase1` · sin commit |
| [recordatorios](recordatorios.md) — Fase 2, US-03: configuración `/recordatorios` + estado de los recordatorios en el voucher | ✅ Implementado · ⚠️ solo con respuestas simuladas | `feature/fase2-recordatorios` · sin commit |
| [crear-cita](crear-cita.md) — modal "Nueva cita" del profesional; Fase 2: correo obligatorio · lote 2: bloques 07:00–21:00, la cita termina a más tardar a las 22:00 | ✅ Implementado y conectado · ⚠️ el cambio de Fase 2 sin prueba contra el backend | `feature/fase2-recordatorios` · lote 2 en `feature/frontend-prerelease`, sin commit |
| [login-sesion](login-sesion.md) — login, sesión persistente (F5 / otra pestaña), 401 global, cerrar sesión y sidebar con datos reales | ✅ Implementado · ⚠️ lo nuevo verificado solo con respuestas simuladas | `feature/frontend-prerelease` · `a39dbdc` |

## Notas

- **Detalles menores de la auditoría (2026-10-06, `chore/frontend-detalles-menores`, sin commit):**
  página "No encontrada" para URLs desconocidas y `meta.public` fuera del router
  ([login-sesion](login-sesion.md)); "Nueva cita" sin fechas pasadas y sin cerrarse mientras guarda
  ([crear-cita](crear-cita.md)); calendario público con navegación entre meses (hasta 3 hacia adelante) y
  sin horas pasadas ([agendar-cita-paciente](agendar-cita-paciente.md)); horas en la zona fija de Chile en
  todo el front, que cerró [DTF-07](../Deudas/DTF-07.md); `<html lang="es">`.
- **Fase 2 — recordatorios (2026-10-04):** [recordatorios](recordatorios.md) (pantalla nueva y estado
  en el voucher) y el **correo obligatorio** del modal ([crear-cita](crear-cita.md)), que **debe salir
  en el mismo release que el backend** o el modal recibe 400. El despliegue en Netlify
  (`public/_redirects`) está en [stack-tecnologico](../stack-tecnologico.md#despliegue-netlify).
- **Limpieza previa al release, lote 2 (2026-10-05):** dashboard sin datos de prueba (cuatro tarjetas
  reales, "Citas por semana" y tarjeta de Recordatorios — [dashboard-citas-del-dia](dashboard-citas-del-dia.md)),
  canceladas ocultas por defecto en "Citas de hoy" y en la agenda (revierte US-02.09 §4), carriles sin
  canceladas y recarga al entrar ([agenda-profesional](agenda-profesional.md)), **Confirmar / Asistió / No
  asistió** en el voucher ([gestionar-cita](gestionar-cita.md)) y bloques horarios 07:00–21:00 con fin de
  jornada a las 22:00 ([crear-cita](crear-cita.md)). Cerró DTF-03.
- **Limpieza previa al release, lote 1 (2026-10-05):** [login-sesion](login-sesion.md). La sesión
  sobrevive a un F5, un 401 lleva al login, hay "Cerrar sesión", y se quitó del login, del sidebar y
  del topbar todo lo que no funcionaba o mostraba datos inventados. Cerró DTF-01, DTF-02 y DTF-04.
  El contrato del login vive del lado del backend (`us00b-login.md`).
- **Cierre de Fase 1 (2026-09-25):** agenda y bandeja se construyeron contra el **contrato**
  (`citia-backend/context/Features/us02-gestion-citas.md` § Cierre de Fase 1) mientras el backend
  se implementaba en paralelo. Todo campo nuevo (`fecha`, `avisos`, `tenantSlug`, `resueltaEn`) se
  tolera ausente.
- **Todo el dashboard es real** desde el lote 2 ([dashboard-citas-del-dia](dashboard-citas-del-dia.md)):
  métricas, ausentismo y actividad del motor se quitaron; [DTF-03](../Deudas/DTF-03.md) está cerrada.
- El contexto del front es más delgado que el del backend a propósito: las **decisiones de
  arquitectura y de dominio se documentan en el backend** (ADRs), y aquí solo lo que es propio de la
  interfaz — rutas, contrato de integración y copy que carga significado.
