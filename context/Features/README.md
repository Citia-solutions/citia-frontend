# Índice de Features — Frontend

Cada feature documenta una funcionalidad implementada: qué hace, el contrato con el backend, las
decisiones propias del front y sus pendientes. Misma convención que el backend.

| Feature | Estado | Rama / commits |
|---------|--------|----------------|
| [agendar-cita-paciente](agendar-cita-paciente.md) | ✅ Implementado y conectado | `feature/agendar-cita-paciente` · `e18c34c`, `1980990` |
| [dashboard-citas-del-dia](dashboard-citas-del-dia.md) — US-06 + subtarea US-02.09 | ✅ Implementado y conectado · ⚠️ sin prueba manual contra el backend | `feature/us02-voucher-dashboard` · sin commit |
| [gestionar-cita](gestionar-cita.md) — voucher, subtarea US-02.08 | ✅ Implementado y conectado · ⚠️ sin prueba manual contra el backend | `feature/us02-voucher-dashboard` · sin commit |
| [agenda-profesional](agenda-profesional.md) — cierre de Fase 1 US-02: agenda semanal + lista, aviso de solapamiento (ADR-11), layout del panel | ✅ Implementado · ⚠️ solo con respuestas simuladas (backend en paralelo) | `feature/us02-cierre-fase1` · sin commit |
| [bandeja-solicitudes](bandeja-solicitudes.md) — cierre de Fase 1 US-02: bandeja (listar, aceptar, rechazar) + enlace de agenda | ✅ Implementado · ⚠️ solo con respuestas simuladas (backend en paralelo) | `feature/us02-cierre-fase1` · sin commit |

## Notas

- **El modal "nueva cita" del profesional** y el **login** están implementados y conectados, pero
  todavía sin documento propio. Se escribirán cuando se toquen; el contrato de ambos vive del lado
  del backend en `citia-backend/context/Features/`.
- **Cierre de Fase 1 (2026-09-25):** agenda y bandeja se construyeron contra el **contrato**
  (`citia-backend/context/Features/us02-gestion-citas.md` § Cierre de Fase 1) mientras el backend
  se implementaba en paralelo. Todo campo nuevo (`fecha`, `avisos`, `tenantSlug`, `resueltaEn`) se
  tolera ausente.
- **La lista del dashboard ya es real** ([dashboard-citas-del-dia](dashboard-citas-del-dia.md));
  métricas, ausentismo y actividad siguen con datos de prueba: ver [DTF-03](../Deudas/DTF-03.md).
- El contexto del front es más delgado que el del backend a propósito: las **decisiones de
  arquitectura y de dominio se documentan en el backend** (ADRs), y aquí solo lo que es propio de la
  interfaz — rutas, contrato de integración y copy que carga significado.
