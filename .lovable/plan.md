

## Programa de Referidos con Reward configurable por Admin

### Resumen
Programa de referidos donde cada usuario tiene un codigo unico, puede referir amigos, y cuando el referido completa su primer paquete o viaje, el referidor recibe un reward en quetzales. El monto del reward es configurable por el admin desde el panel de Control Admin.

### Configuracion del reward

Se usa la tabla existente `app_settings` para almacenar el monto del reward. El admin puede cambiarlo desde una nueva card en AdminControl con un input numerico. Valor por defecto: Q30.

- Key: `referral_reward_amount`
- Value: `{ "amount": 30 }`

### Base de datos (1 migracion)

**Columna nueva en `profiles`:**
- `referral_code` (text, unique, nullable)

**Funcion `generate_referral_code()`:** genera codigo alfanumerico unico de 6 caracteres. Se ejecuta via trigger al insertar un perfil.

**Tabla `referrals`:**

| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| referrer_id | uuid | quien refirio |
| referred_id | uuid, unique | un usuario solo puede ser referido una vez |
| status | text | 'pending' o 'completed' |
| reward_amount | numeric | se lee de app_settings al momento de completarse |
| completed_at | timestamptz | nullable |
| created_at | timestamptz | default now() |

**RLS en `referrals`:**
- SELECT: usuarios ven donde son referrer_id = auth.uid(), admins ven todo
- INSERT: usuarios autenticados pueden insertar si referred_id = auth.uid()

**Trigger en `packages`:** Cuando status cambia a `completed`, si el user_id tiene un referral pendiente y no tiene otros paquetes completados previos, marcar referral como completed, leer reward de app_settings, y crear notificacion.

**Trigger en `trips`:** Misma logica cuando status de un viaje cambia a `completed`.

**Insertar setting inicial:**
```text
INSERT INTO app_settings (key, value, description)
VALUES ('referral_reward_amount', '{"amount": 30}', 'Monto del reward de referidos en GTQ');
```

### Archivos nuevos y modificados

**`src/pages/AdminControl.tsx`** - Agregar card de "Programa de Referidos":
- Input numerico para cambiar el monto del reward
- Lee y escribe a `app_settings` con key `referral_reward_amount`
- Boton "Guardar" con feedback

**`src/hooks/useReferrals.tsx`** (nuevo):
- Cargar referral_code del usuario (de profiles)
- Cargar referidos y saldo (SUM de reward_amount donde status = completed)
- Cargar monto actual del reward desde app_settings
- Funcion para registrar referido post-signup

**`src/components/profile/ReferralSection.tsx`** (nuevo):
- Codigo con boton copiar link
- Saldo acumulado (Q ganados)
- Contador de amigos referidos
- Boton compartir por WhatsApp
- Lista de referidos con status

**`src/components/UserProfile.tsx`** - Agregar ReferralSection despues de la seccion de Informacion Bancaria

**`src/pages/Auth.tsx`** - Capturar parametro `ref` de la URL:
- Guardar en localStorage como `pending_referral_code`
- Despues del signup exitoso, buscar el codigo en profiles.referral_code, si existe crear registro en referrals con status pending y referred_id = nuevo usuario

### Flujo completo

```text
1. Admin configura reward a Q30 desde Control Admin
2. Usuario A copia link: favoron.app/auth?ref=ABC123
3. Usuario B abre link -> localStorage guarda ABC123
4. Usuario B se registra -> referral creado (status: pending)
5. Usuario B completa su primer pedido (status -> completed) -> Trigger DB:
   - Lee reward de app_settings (Q30)
   - referral.status = 'completed', reward_amount = 30
   - Notificacion: "Tu amigo completo su primer pedido. Ganaste Q30!"
6. Usuario A ve Q30 en su perfil
```

### Archivos afectados

| Archivo | Accion |
|---------|--------|
| Migracion SQL | profiles.referral_code + tabla referrals + triggers + RLS + app_setting |
| src/pages/AdminControl.tsx | Card para configurar monto reward |
| src/pages/Auth.tsx | Capturar ?ref= y registrar referido |
| src/hooks/useReferrals.tsx | Nuevo hook |
| src/components/profile/ReferralSection.tsx | Nuevo componente |
| src/components/UserProfile.tsx | Integrar ReferralSection |

