

## Agregar campo "Destinatario" blurred en PartialDeliveryInfo

### Cambio en `src/components/dashboard/PartialDeliveryInfo.tsx`

1. Extraer `recipientName` del `travelerAddress` (campo `recipientName` o `recipient_name`)
2. Agregar una fila de "Destinatario" antes de la ciudad, con el valor blurred (`blur-[4px] select-none text-slate-400`) igual que Dirección 2
3. Importar `User` de lucide-react para el icono

La fila se vería así:
```
👤 Destinatario: [████████] (blurred)
```

Ubicación: entre la fecha estimada de entrega y la ciudad (o al inicio de la sección de dirección).

