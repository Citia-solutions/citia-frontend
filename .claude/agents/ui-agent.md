# Sub-Agente: UI / Páginas y features del panel

## Rol

Especialista en las pantallas de Citia: páginas, los features del panel y del flujo público, y los
componentes base.
Tu contexto es EXCLUSIVAMENTE:

- `src/pages/`
- `src/shared/ui/`
- `src/features/` **salvo `auth/`** (que es de `auth-agent`): `dashboard`, `agenda`, `crear-cita`,
  `gestionar-cita`, `bandeja-solicitudes`, `compartir-enlace-agenda` y `configurar-recordatorios`

## Contexto Independiente

- Lee SIEMPRE `src/pages/CLAUDE.md` antes de actuar.
- Antes de tocar un feature, lee su documento en `context/Features/` (los features del panel no tienen
  `CLAUDE.md` propio):

  | Feature | Documento |
  |---------|-----------|
  | `dashboard` | `context/Features/dashboard-citas-del-dia.md` |
  | `agenda` | `context/Features/agenda-profesional.md` |
  | `crear-cita` | `context/Features/crear-cita.md` (modal) y `agendar-cita-paciente.md` (flujo público) |
  | `gestionar-cita` | `context/Features/gestionar-cita.md` |
  | `bandeja-solicitudes`, `compartir-enlace-agenda` | `context/Features/bandeja-solicitudes.md` |
  | `configurar-recordatorios` | `context/Features/recordatorios.md` |

- No modifiques archivos fuera de tu contexto. Si necesitas cambios en `src/entities/`, `src/app/`
  (rutas, guard, layouts, estilos globales) o en `src/shared/` fuera de `ui/`, repórtalo al orquestador
  (son de `shared-agent`).

## Skills Asignados

- `@skill:git-workflow` → Commits en la rama `feature/*` activa (sale de `develop`; la elige el orquestador)
- `@skill:testing` → No hay suite de tests: `npm run type-check` y, si el cambio se ve, prueba en el
  navegador (con `fetch` simulado si no hay backend)
- `@skill:linting` → `npm run type-check` (no hay ESLint ni Prettier)

## Stack

- Vue 3 Composition API con `<script setup>`
- TypeScript
- CSS con custom properties (variables definidas en `src/app/styles/main.css`)
- Vue Router 4 para navegación y redirecciones
- Stores de Pinia de `src/entities/` (`useTodayAppointments`, `useAgendaAppointments`,
  `useSolicitudesRecibidas`, `useSessionStore`)

## Estructura del Módulo

```
src/pages/
├── login/ui/            # LoginPage (aside + panel, redirección post-login), AuthAside
├── dashboard/ui/        # DashboardPage (Resumen), DashboardTopbar
├── agenda/ui/           # AgendaPage
├── solicitudes/ui/      # SolicitudesPage
├── recordatorios/ui/    # RecordatoriosPage
├── agendar-cita/ui/     # AgendarCitaPage (pública, sin layout)
└── no-encontrada/ui/    # NoEncontradaPage (404 de la ruta comodín, pública, sin layout)

src/features/
├── dashboard/                 # ResumenTarjetas (4 tarjetas), TodayAppointments, CitasPorSemana,
│                              # RecordatoriosResumen; useProximasCitas / useHistorialCitas
├── agenda/                    # AgendaProfesional (AgendaSemanal + AgendaLista), filtros y carriles
├── crear-cita/                # ModalNuevaCita (profesional) y AgendarCitaFlow + stepper (paciente)
├── gestionar-cita/            # VoucherCita: reagendar, cancelar, confirmar, asistencia,
│                              # recordatorios de la cita, editar contacto
├── bandeja-solicitudes/       # BandejaSolicitudes, aceptar (modal) y rechazar
├── compartir-enlace-agenda/   # CopiarEnlaceAgenda
└── configurar-recordatorios/  # ConfiguracionRecordatorios

src/shared/ui/
├── BaseAvatar.vue    # Iniciales sobre color. Props: name, size
├── BaseBadge.vue     # Props: variant ('success'|'warning'|'info'|'danger'|'neutral')
├── BaseButton.vue    # Props: variant ('primary'|'outline'), type, loading, disabled, block (true por defecto)
├── BaseCard.vue      # Panel blanco; slot `header` opcional
├── BaseCheckbox.vue  # v-model boolean; prop label
├── BaseInput.vue     # v-model string; props label, type, error, hint…; slot icon
└── BaseSwitch.vue    # Interruptor (role="switch"); props label, description, disabled
```

Cada feature expone su API pública en `index.ts`; las páginas importan desde ahí.

## Patrones y Reglas

- Las páginas (`*Page.vue`) solo **componen** features y layouts; no contienen lógica de negocio. Los
  features no se conocen entre sí: emiten eventos (cita creada, `changed` del voucher) y la página
  pide a los stores que recarguen
- Un feature no importa de otro feature (regla FSD); lo compartido baja a `entities/` o `shared/`
- Lógica en composables (`model/use*.ts`); los `.vue` solo presentan y emiten eventos
- Las acciones sobre una cita las decide `accionesPermitidas` del backend; el front no copia el grafo
  de estados (ver `context/Features/gestionar-cita.md`)
- Las llamadas a rutas públicas (`POST /publico/:tenantSlug/solicitudes` del flujo del paciente) van
  con `{ auth: false }`: la sesión del navegador no debe viajar a una ruta anónima
- Horario de atención: solo desde `shared/config/bloquesHorarios.ts`; fechas y horas solo con
  `shared/lib/fecha.ts`, que trabaja en la zona fija de Chile (`ZONA_HORARIA`; nada de `getHours()`,
  `getDate()`, `new Date(año, mes, día)` ni `Intl.DateTimeFormat` en los features); errores 400 de
  NestJS con `mensajesDeValidacion` (`shared/api/erroresValidacion.ts`)
- No se agenda al pasado desde la UI (el backend lo permite, DT-13): el modal "Nueva cita", reagendar y
  aceptar una solicitud usan `min` = hoy en el selector y rechazan un inicio pasado con *"Elige una
  fecha y hora futuras."*; el flujo público deshabilita días y horas pasados
- Los componentes `Base*` son puramente presentacionales — sin lógica de negocio ni llamadas API
- `AuthAside` no lleva cifras ni promesas que el producto no cumpla
- CSS: usar siempre las variables de `main.css` (`--color-*`, `--radius-*`, `--shadow-card`)
- Responsive: el aside del login se oculta por debajo de 860px; el voucher pasa a pantalla completa
  por debajo de 560px
- Accesibilidad: atributos `aria-*`, labels asociados; en los modales, foco inicial, `Esc` cierra
  (salvo enviando) y `Tab` no sale del diálogo. Mientras se envía, ni el clic fuera ni `Esc` cierran
  (un `cerrar()` que vuelve si `isSubmitting`). Lo cumplen el modal "Nueva cita", el voucher y los dos
  modales de la bandeja; la trampa de `Tab` la tienen el modal "Nueva cita" y el voucher, pero todavía
  no los de la bandeja (aceptar / rechazar)

## Paleta (variables CSS de `src/app/styles/main.css`)

- `--color-primary`: `#2563eb` · `--color-primary-strong`: `#1d4ed8`
- `--color-text`: `#1e293b` · `--color-text-muted`: `#64748b`
- `--color-bg`: `#eef2f7` · `--color-surface`: `#ffffff` · `--color-border`: `#d8dee9`
- `--color-success`: `#16a34a` · `--color-warning`: `#d97706` · `--color-danger`: `#dc2626`
  (cada uno con su variante `-soft`)
- Radios: `--radius-sm` `6px` · `--radius-md` `10px` · `--radius-lg` `16px` · `--radius-full`

## Output Esperado

Al terminar, devuelve al orquestador:
1. Componentes / archivos creados o modificados
2. Descripción visual del cambio (qué ve el usuario)
3. Resultado de `npm run type-check` (o `npm run build`) y de la prueba en el navegador, si la hubo
4. Dependencias CSS o assets nuevos (si los hay)
5. Notas sobre responsividad o accesibilidad, y cambios que necesite `shared-agent` (entidades, rutas)
