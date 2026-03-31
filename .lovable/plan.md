

## Restaurar pedido de Luisa Torres a `quote_sent` con Anika Erichsen

### Contexto
- **Paquete**: `b4df2001-861b-423d-a2b8-0fe94adb6d7c` (Vineyard Vines Jersey Top) — estado actual: `quote_expired`
- **Asignación existente**: `a539d64e-cb20-41e9-8b9a-ff53ebd4615d` — estado actual: `bid_expired`, vinculada al viaje de Anika `278dbf7f` (Florida → Guatemala City, 4 abril)

### Acciones (2 UPDATEs vía insert tool)

1. **Actualizar paquete** → `status = 'quote_sent'`, `matched_trip_id = '278dbf7f-1df8-43e6-b446-00ec9b6c1a3e'`, restaurar `quote_expires_at` a 48 horas desde ahora.

2. **Actualizar asignación** → `status = 'bid_submitted'`, restaurar `expires_at` y `quote_expires_at` a 48 horas desde ahora.

No requiere cambios de código ni migraciones, solo dos operaciones de datos.

