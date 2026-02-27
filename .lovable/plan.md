

## Plan: Copiar mensaje de invitación completo en el modal de referidos

### Cambio en `src/components/dashboard/ReferralAnnouncementModal.tsx`

1. Importar `APP_URL` de `@/lib/constants`
2. Cambiar `referralLink` para usar `APP_URL` en vez de `window.location.origin` (consistente con `ReferralBanner`)
3. En `handleCopy`, copiar un `shareMessage` con texto de invitación igual al del banner:
   ```
   ¡Únete a Favorón con mi link de referido y recibe un descuento de Q${discountAmount} en tu primer pedido! ${referralLink}
   ```

