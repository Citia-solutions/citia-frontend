# Módulo: Shared

## Propósito

Utilidades, tipos y componentes base usados por CUALQUIER capa del proyecto.
CUALQUIER cambio aquí puede afectar a TODOS los módulos. Avisar al orquestador antes de modificar.

## Estructura

```
src/shared/
├── api/
│   └── httpClient.ts     # request<T>(), http.get/post/put/patch/delete()
│                         # Inyecta Bearer token automáticamente
│                         # Base URL: import.meta.env.VITE_API_URL ?? '/api'
│                         # Lanza HttpError con status + body en errores
├── lib/
│   └── authToken.ts      # getToken(), setToken(token, persistent), removeToken()
│                         # persistent=true → localStorage; false → sessionStorage
└── ui/
    ├── BaseButton.vue    # Props: variant('primary'|'outline'), loading, block
    ├── BaseInput.vue     # Props: modelValue, type, icon, error; slot: icon
    └── BaseCheckbox.vue  # Props: modelValue, label
```

## Reglas Críticas

- No importar de `features/`, `entities/`, ni `pages/` — shared es la capa más baja
- `httpClient.ts` es transporte genérico; NO añadir lógica de negocio
- `authToken.ts` solo maneja el token; NO añadir estado de usuario aquí
- Cambios en `HttpError` o en la firma de `request<T>()` requieren verificar todos los módulos

## Variables de Entorno

- `VITE_API_URL`: URL base del backend (default: `/api`)
