# Índice de Deudas Técnicas — Frontend

Registro de lo que el frontend **no** hace y debería, o hace de forma provisional. Cada deuda enlaza
al archivo concreto que la origina. Misma convención que el backend, con prefijo `DTF-` para que los
identificadores de los dos repos no se confundan al hablar de ellos.

**Estados:** `abierta` · 🔵 `aceptada a conciencia` (se decidió no resolverla, con su razón) ·
`cerrada`.

---

| ID | Deuda | Severidad | Estado | Origen |
|----|-------|-----------|--------|--------|
| [DTF-01](DTF-01.md) | `isAuthenticated` acepta una sesión a medias | 🟠 media | abierta | `entities/session/model/store.ts` |
| [DTF-03](DTF-03.md) | El dashboard muestra datos de prueba (**solo métricas, ausentismo y actividad**; la lista de citas ya es real) | 🟡 baja | abierta (parte citas cerrada) | `features/dashboard/api/dashboardApi.ts` |
| [DTF-02](DTF-02.md) | `fetchCurrentUser()` apunta a un endpoint que no existe | 🟡 baja | abierta | `entities/session/api/sessionApi.ts` |
| [DTF-04](DTF-04.md) | El modelo de sesión contempla un rol que el backend no emite | 🟡 baja | abierta | `entities/session/model/types.ts` |
| [DTF-05](DTF-05.md) | El algoritmo del RUT está duplicado en los dos repos | 🟡 baja | 🔵 aceptada | `shared/lib/rut.ts` |
| [DTF-06](DTF-06.md) | Los largos máximos del formulario público y del motivo del voucher copian los de los DTO | 🟡 baja | 🔵 aceptada | `features/crear-cita/model/flujoCitaModel.ts`, `features/gestionar-cita/` |
| [DTF-07](DTF-07.md) | Se asume que la zona del navegador es la de la clínica | 🟡 baja | abierta | `shared/lib/fecha.ts` |

---

## Notas

**DTF-03 ya no confunde al probar:** desde US-02.09 una cita guardada sí aparece en la lista del
día. Lo que sigue con datos fijos (métricas, ausentismo, actividad) no tiene endpoint.

**Ninguna de estas siete decide nada.** Registran el estado actual y, donde hay más de un camino,
lo dejan explícito para la historia de usuario que corresponda. El mapeo de estados del dashboard
**ya se decidió** en US-02.09: los seis del backend, sin `recuperada` ni `riesgo_alto`.

**Deudas encadenadas al backend:** DTF-03 tiene su contraparte en `DT-29` (funcionalidad
implementada y no conectada), y DTF-04 depende de `DT-07` y `DT-02`. Ambas en
`citia-backend/context/Deudas/`. DTF-06 se rompe si cambia el DTO provisional de solicitudes del
backend.

**Bloqueo que no es del front:** el enlace público `/agendar-cita/:tenantSlug` está conectado pero
**no debe compartirse** hasta que el backend cierre `DT-18` (límite de tasa en la ruta pública).
