

## Cambio: Mensaje de referido con monto dinámico desde app_settings

### Problema
El mensaje actual dice "recibes un descuento" sin especificar el monto, y agrega "yo también gano" que no se quiere.

### Solución
1. Fetch el valor de `referred_user_discount` desde `app_settings` en `ReferralSection`
2. Actualizar el `shareMessage` a: `¡Únete a Favorón con mi link de referido y recibe un descuento de Q{monto} en tu primer pedido! 🎁 {link}`

### Cambios en `src/components/profile/ReferralSection.tsx`
- Agregar `useState` + `useEffect` para cargar el monto de `app_settings` key `referred_user_discount`
- Importar `supabase`
- Cambiar `shareMessage` para usar el monto dinámico y quitar "yo también gano"
- Default a Q15 si no se puede cargar

### Detalle del mensaje resultante
```
¡Únete a Favorón con mi link de referido y recibe un descuento de Q15 en tu primer pedido! 🎁 https://favoron.app/auth?ref=9GYTT8
```

