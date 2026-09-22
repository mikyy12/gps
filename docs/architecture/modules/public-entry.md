# Entrada pública y login

**Código:** `src/app/page.tsx`.

Responsabilidad: autenticación y entrada inicial.

## Estado S0

El login usa Supabase Auth y, después de autenticar, consulta el rol real del perfil. El destino por defecto ya no es `/admin`:

- `admin` → `/admin`
- `agency` → `/agency`
- `operator` → `/operator`

El parámetro `next` solo se acepta si es una ruta interna dentro del portal correspondiente al rol. Rutas de otro rol, URLs externas, scheme-relative URLs y valores no internos vuelven al home autorizado. Una cuenta autenticada sin rol operativo válido se cierra y muestra un mensaje de aprovisionamiento pendiente.

Para mantener `/` prerenderizable en Next.js 16, el componente no usa `useSearchParams()` durante render. `next` se lee con `URLSearchParams(window.location.search)` exclusivamente dentro del submit del login, que solo se ejecuta en navegador, y después pasa por `resolvePostLoginPath`.

## Invariantes

- El cliente nunca decide permisos; solo selecciona un destino ya compatible con el rol obtenido de datos protegidos.
- `next` no puede abrir un redirect externo ni saltar entre áreas de rol.
- La lectura de query params del login no debe convertir la página raíz en un bailout CSR innecesario ni romper prerender de producción.
- No exponer detalles sensibles de errores de autenticación.
- Un usuario nuevo no debe obtener un rol operativo por el mero hecho de registrarse.
