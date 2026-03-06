

## Correcciones al sistema de referidos

### Situación actual (datos reales)
- 4 registros en `referrals`, 3 apuntan al admin como referidor (incluyendo cuentas de prueba)
- Rocio Carrillo no aparece como referidora de nadie — el referido Rocio → Alex no existe
- Alex Perez tiene cuenta pero no hay registro de referido para él
- Cada usuario tiene un código único (confirmado, no hay duplicados)

### Causa raíz
El `pending_referral_code` en `localStorage` persiste indefinidamente. Cuando se hicieron pruebas con el link del admin, ese código quedó guardado en los navegadores y se usó automáticamente en registros posteriores.

### Plan de implementación

**1. Expiración del código en localStorage** (`Index.tsx` + `Auth.tsx`)
- Al guardar `pending_referral_code`, guardar también `pending_referral_code_ts` con `Date.now()`
- En `Auth.tsx` antes de llamar `registerReferral`, verificar que el código tenga menos de 7 días. Si expiró, eliminarlo

**2. Herramientas admin para corregir datos** (`AdminReferrals.tsx`)
- Agregar políticas RLS de DELETE e INSERT para admins en la tabla `referrals`
- Agregar columna "Acciones" con botón Eliminar (con confirmación AlertDialog)
- Agregar botón "Agregar referido" que busca usuarios por email y crea el registro manualmente

Con esto podrás:
1. Eliminar los 3 referidos incorrectos del admin (incluyendo los de prueba)
2. Crear manualmente el referido correcto: Rocio → Alex
3. Prevenir que esto vuelva a pasar con la expiración de 7 días

