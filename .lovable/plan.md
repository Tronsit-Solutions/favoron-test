

## Referral link directo a registro

Actualmente el link de referido (`/auth?ref=CODE`) ya apunta a la página de auth, pero el link que se copia en `ReferralBanner` usa `favoron.app/auth?ref=CODE`. El problema es que algunos componentes generan el link como `/?ref=CODE` (landing page) en vez de `/auth?ref=CODE`.

### Cambios

**`src/components/dashboard/ReferralBanner.tsx`**:
- Cambiar `referralLink` de `${APP_URL}/auth?ref=${referralCode}` → verificar que ya apunta a `/auth`
- Asegurar que el link incluya el modo registro: `${APP_URL}/auth?ref=${referralCode}&mode=register`

**`src/pages/Auth.tsx`**:
- Leer el query param `mode=register` y abrir directamente en modo registro en vez de login

Esto hará que al abrir el link de referido, el usuario vea directamente el formulario de registro.

