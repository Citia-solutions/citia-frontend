# Índice de Deudas Técnicas — Frontend

Registro de lo que el frontend **no** hace y debería, o hace de forma provisional. Cada deuda enlaza
al archivo concreto que la origina. Misma convención que el backend, con prefijo `DTF-` para que los
identificadores de los dos repos no se confundan al hablar de ellos.

**Estados:** `abierta` · 🔵 `aceptada a conciencia` (se decidió no resolverla, con su razón) ·
`cerrada`.

---

| ID | Deuda | Severidad | Estado | Origen |
|----|-------|-----------|--------|--------|
| [DTF-01](DTF-01.md) | `isAuthenticated` acepta una sesión a medias | 🟠 media | cerrada (2026-10-05) | `entities/session/model/store.ts` |
| [DTF-03](DTF-03.md) | El dashboard muestra datos de prueba (**solo métricas, ausentismo y actividad**; la lista de citas ya es real) | 🟡 baja | abierta (parte citas cerrada) | `features/dashboard/api/dashboardApi.ts` |
| [DTF-02](DTF-02.md) | `fetchCurrentUser()` apunta a un endpoint que no existe | 🟡 baja | cerrada (2026-10-05) | `entities/session/api/sessionApi.ts` (borrado) |
| [DTF-04](DTF-04.md) | El modelo de sesión contempla un rol que el backend no emite | 🟡 baja | cerrada (2026-10-05) | `entities/session/model/types.ts` |
| [DTF-05](DTF-05.md) | El algoritmo del RUT está duplicado en los dos repos | 🟡 baja | 🔵 aceptada | `shared/lib/rut.ts` |
| [DTF-06](DTF-06.md) | Los límites del formulario público, del motivo del voucher, del rango de la agenda (42 días), de la duración (1440), de la bandeja (100), del correo del paciente (254) y de la configuración de recordatorios copian los del backend | 🟡 baja | 🔵 aceptada | `features/crear-cita/model/`, `features/gestionar-cita/`, `entities/appointment/api/`, `features/bandeja-solicitudes/model/`, `features/configurar-recordatorios/model/` |
| [DTF-07](DTF-07.md) | Se asume que la zona del navegador es la de la clínica (también para las horas de los recordatorios) | 🟡 baja | abierta | `shared/lib/fecha.ts` |

---

## Notas

**DTF-03 ya no confunde al probar:** desde US-02.09 una cita guardada sí aparece en la lista del
día. Lo que sigue con datos fijos (métricas, ausentismo, actividad) no tiene endpoint.

**Ninguna de las abiertas decide nada.** Registran el estado actual y, donde hay más de un camino,
lo dejan explícito para la historia de usuario que corresponda. El mapeo de estados del dashboard
**ya se decidió** en US-02.09: los seis del backend, sin `recuperada` ni `riesgo_alto`.

**Cerradas por la limpieza previa al release (2026-10-05):** DTF-01, DTF-02 y DTF-04, con la
sesión persistente y el 401 global — ver [login-sesion](../Features/login-sesion.md).

**Deudas encadenadas al backend:** DTF-03 tiene su contraparte en `DT-29` (funcionalidad
implementada y no conectada). Un rol nuevo (ver DTF-04, cerrada) depende de `DT-07` y `DT-02`.
Todas en `citia-backend/context/Deudas/`. DTF-06 se rompe si cambia el DTO provisional de
solicitudes del backend.

**Bloqueo que no es del front:** el enlace público `/agendar-cita/:tenantSlug` está conectado pero
**no debe compartirse** hasta que el backend cierre `DT-18` (límite de tasa en la ruta pública).
Desde el cierre de Fase 1 el front lo **muestra** ("Copiar enlace de agenda", en `/solicitudes`)
con una advertencia gobernada por `ENLACE_PUBLICO_LISTO = false`
(`features/compartir-enlace-agenda/model/enlaceAgenda.ts`); al cerrar DT-18 se cambia a `true`.
