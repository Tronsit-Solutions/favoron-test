

## Agregar banner de referidos en la pestaña Home del Dashboard

### Ubicacion
En el `TabsContent value="overview"` del Dashboard (linea 592-600), despues de `AvailableTripsCard` y antes de cerrar el tab. Es lo primero que el usuario ve al entrar al dashboard.

### Cambios

**1. Nuevo: `src/components/dashboard/ReferralBanner.tsx`**
- Componente tipo card/banner promocional para el programa de referidos
- Usa el hook `useReferrals` para obtener el codigo del usuario y stats
- Fetch del descuento desde `app_settings` key `referred_user_discount` (igual que ReferralSection)
- Muestra:
  - Titulo con icono Gift: "Invita amigos y gana recompensas"
  - Subtitulo: "Comparte tu codigo y ambos ganan: Q30 para ti, Q15 de descuento para tu amigo"
  - Codigo de referido con boton copiar
  - Botones: "Copiar mensaje" y "Compartir por WhatsApp"
  - Mini stats: referidos totales y completados (si hay)
- Estilo: Card con fondo gradiente sutil (primary/10), visualmente diferente a las otras cards
- Reutiliza la misma logica de shareMessage de `ReferralSection`

**2. Editar: `src/components/Dashboard.tsx`**
- Importar `ReferralBanner` 
- Agregarlo dentro de `TabsContent value="overview"` despues de `AvailableTripsCard`:
  ```tsx
  <TabsContent value="overview" className="space-y-6">
    <QuickActions ... />
    <AvailableTripsCard ... />
    <ReferralBanner />
  </TabsContent>
  ```

### Detalle visual
- Card con borde y fondo `bg-gradient-to-r from-primary/5 to-purple-50`
- Layout responsive: en mobile todo apilado, en desktop el codigo y botones al lado del texto
- Botones compactos de copiar y WhatsApp
- Si el usuario ya tiene referidos completados, muestra un mini badge "X referidos completados"

