# Índice de Features — Frontend

Cada feature documenta una funcionalidad implementada: qué hace, el contrato con el backend, las
decisiones propias del front y sus pendientes. Misma convención que el backend.

| Feature | Estado | Rama / commits |
|---------|--------|----------------|
| [agendar-cita-paciente](agendar-cita-paciente.md) | ✅ Implementado y conectado | `feature/agendar-cita-paciente` · `e18c34c`, `1980990` |

## Notas

- **El modal "nueva cita" del profesional** y el **login** están implementados y conectados, pero
  todavía sin documento propio. Se escribirán cuando se toquen; el contrato de ambos vive del lado
  del backend en `citia-backend/context/Features/`.
- **El dashboard usa datos de prueba.** No tiene doc porque no está conectado: ver
  [DTF-03](../Deudas/DTF-03.md).
- El contexto del front es más delgado que el del backend a propósito: las **decisiones de
  arquitectura y de dominio se documentan en el backend** (ADRs), y aquí solo lo que es propio de la
  interfaz — rutas, contrato de integración y copy que carga significado.
