

## Por qué el programa de referidos no funciona

### Problemas encontrados

**Problema 1 — Login mata el retry antes de que ejecute:**
En la linea 420-422 de Auth.tsx:
```js
retryPendingReferral(data.user.id);       // async con delay de 500ms+
window.location.href = `${APP_URL}/dashboard`;  // navega INMEDIATAMENTE
```
`retryPendingReferral` es async y necesita al menos 500ms antes de hacer el RPC, pero `window.location.href` navega inmediatamente, matando la función async. El código de referido queda en localStorage pero nunca se registra.

**Problema 2 — No hay retry en el Dashboard:**
La función `retryPendingReferral` solo se llama en Auth.tsx (login). No hay ninguna llamada en Dashboard, App, o cualquier otro componente que se cargue después del login. Si el retry falla durante signup o login, no hay segunda oportunidad.

**Problema 3 — Signup funciona pero es frágil:**
En signup (linea 306), `attemptReferralRegistration` se dispara con 1.5s de delay fire-and-forget. Si el usuario cierra el tab antes de que el RPC complete, se pierde. Y no hay retry posterior.

### Plan de corrección

**1. Esperar al retry antes de navegar en Login (Auth.tsx)**
- Cambiar `retryPendingReferral` para que sea `await` antes del redirect
- Pero solo esperar un máximo de ~3s para no bloquear al usuario

**2. Agregar retry en el Dashboard (Dashboard o App.tsx)**
- Llamar `retryPendingReferral(user.id)` cuando el dashboard carga y hay un usuario autenticado
- Esto actúa como red de seguridad si el signup/login falló

### Archivos a modificar
- `src/pages/Auth.tsx` — await el retry antes de redirect en login
- `src/pages/Dashboard.tsx` (o equivalente) — agregar retry al montar

