

## Cambio: "Copiar link" copia un mensaje completo, no solo la URL

Actualmente el botón "Copiar link" copia únicamente la URL. Se debe copiar un mensaje amigable similar al de WhatsApp.

### Cambio en `src/components/profile/ReferralSection.tsx`

Modificar `handleCopy` para que copie el mismo texto promocional que ya se usa en WhatsApp:

```
¡Únete a Favorón con mi link de referido! Tú recibes un descuento en tu primer pedido y yo también gano. 🎁 {referralLink}
```

Así ambos botones (Copiar link y WhatsApp) comparten el mismo mensaje. Solo cambia la línea que pasa `referralLink` a `navigator.clipboard.writeText(...)` por el mensaje completo.

