# Módulo: Shared

## Propósito

Utilidades, tipos y componentes base usados por CUALQUIER capa del proyecto.
CUALQUIER cambio aquí puede afectar a TODOS los módulos. Avisar al orquestador antes de modificar.

## Estructura

```
src/shared/
├── api/
│   └── httpClient.ts     # request<T>(), http.get/post/put/patch/delete()
│                         # Inyecta Bearer token automáticamente;
│                         # { auth: false } lo omite (rutas públicas)
│                         # Base URL: import.meta.env.VITE_API_URL ?? '/api'
│                         # Lanza HttpError con status + body en errores
│                         # onUnauthorized(handler): aviso ante 401 de una petición
│                         # autenticada (lo registra app/providers; ver abajo)
│   └── erroresValidacion.ts # mensajesDeValidacion(e): string[] de un 400 de NestJS
│                            # ({ message: string[] | string }); no traduce nada
├── config/
│   └── bloquesHorarios.ts # Horario de atención: PRIMER_BLOQUE ('07:00'), ULTIMO_BLOQUE ('21:00'),
│                          # DURACION_BLOQUE_MIN (60) → BLOQUES_HORARIOS, FIN_DE_JORNADA ('22:00'),
│                          # HORAS_JORNADA (grilla de la agenda) y errorFinDeJornada(hora, duración).
│                          # Única fuente: modal "Nueva cita", reagendar, aceptar solicitud, flujo
│                          # público y agenda. Para cambiar el horario se tocan solo las 3 constantes
├── lib/
│   └── authToken.ts      # getToken(), setToken(token, persistent), removeToken()
│                         # persistent=true → localStorage; false → sessionStorage
│                         # readTokenClaims(token) → { sub, exp } | null (sin verificar firma)
│                         # isTokenExpired(claims)
│   └── fecha.ts          # Fechas sin librerías, en zona del NAVEGADOR (DTF-07): aInicioISO,
│                         # fechaLocalISO, sumarDias, diferenciaDias, inicioDeSemana (lunes), …
│   └── rut.ts            # Validación y formato del RUT (DTF-05)
└── ui/
    ├── BaseButton.vue    # Props: variant('primary'|'outline'), loading, block
    ├── BaseInput.vue     # Props: modelValue, label, type, error, hint?; slot: icon
    │                     # (label/hint/error quedan asociados al input con useId)
    ├── BaseCheckbox.vue  # Props: modelValue, label
    └── BaseSwitch.vue    # Interruptor (role="switch"). Props: modelValue, label, description?, disabled
```

## Reglas Críticas

- No importar de `features/`, `entities/`, ni `pages/` — shared es la capa más baja
- `httpClient.ts` es transporte genérico; NO añadir lógica de negocio
- `authToken.ts` solo maneja el token; NO añadir estado de usuario aquí (los datos del usuario los
  persiste `entities/session/model/storedUser.ts`, con la misma regla de almacenamiento)
- Toda llamada a una ruta pública/anónima del backend pasa `{ auth: false }`: si el navegador tiene
  sesión, el token no debe viajar a una ruta que no la pide. **El login también** (`POST /auth/login`):
  ahí un 401 es "credenciales inválidas"
- **401 global:** una petición con `auth` (por defecto) que recibe 401 llama al handler de
  `onUnauthorized` y después lanza el `HttpError` como siempre. El handler vive en `app/providers`
  (cierra la sesión y lleva a `/login?redirect=<ruta>`); shared no conoce la sesión ni el router
- Cambios en `HttpError` o en la firma de `request<T>()` requieren verificar todos los módulos

## Variables de Entorno

- `VITE_API_URL`: URL base del backend **incluido el prefijo `/api`** (default: `/api`).
  En local: `http://localhost:3000/api`
