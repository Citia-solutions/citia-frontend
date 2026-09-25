# Índice de Features — Frontend

Cada feature documenta una funcionalidad implementada: qué hace, el contrato con el backend, las
decisiones propias del front y sus pendientes. Misma convención que el backend.

| Feature | Estado | Rama / commits |
|---------|--------|----------------|
| [agendar-cita-paciente](agendar-cita-paciente.md) | ✅ Implementado y conectado | `feature/agendar-cita-paciente` · `e18c34c`, `1980990` |
| [dashboard-citas-del-dia](dashboard-citas-del-dia.md) — US-06 + subtarea US-02.09 | ✅ Implementado y conectado · ⚠️ sin prueba manual contra el backend | `feature/us02-voucher-dashboard` · sin commit |
| [gestionar-cita](gestionar-cita.md) — voucher, subtarea US-02.08 | ✅ Implementado y conectado · ⚠️ sin prueba manual contra el backend | `feature/us02-voucher-dashboard` · sin commit |

## Notas

- **El modal "nueva cita" del profesional** y el **login** están implementados y conectados, pero
  todavía sin documento propio. Se escribirán cuando se toquen; el contrato de ambos vive del lado
  del backend en `citia-backend/context/Features/`.
- **La lista del dashboard ya es real** ([dashboard-citas-del-dia](dashboard-citas-del-dia.md));
  métricas, ausentismo y actividad siguen con datos de prueba: ver [DTF-03](../Deudas/DTF-03.md).
- El contexto del front es más delgado que el del backend a propósito: las **decisiones de
  arquitectura y de dominio se documentan en el backend** (ADRs), y aquí solo lo que es propio de la
  interfaz — rutas, contrato de integración y copy que carga significado.
