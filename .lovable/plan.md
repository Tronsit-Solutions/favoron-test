

## Diagnóstico: Por qué los matches tardan tanto

### Causa raíz: Cascada de triggers en la tabla `packages`

El RPC `assign_package_to_travelers` es muy ligero — solo hace INSERT en `package_assignments` y UPDATE en `packages`. **El INSERT es instantáneo.** El problema es el UPDATE a `packages` (paso 3 del RPC, línea 60-67), que dispara **una cascada de triggers sincronicos**:

```text
assign_package_to_travelers (RPC)
  ├─ INSERT package_assignments    → ~instantáneo ✅
  └─ UPDATE packages (status → 'matched')
       ├─ TRIGGER: notify_traveler_package_status()
       │    └─ create_notification() → INSERT notificación + net.http_post (email)
       ├─ TRIGGER: notify_shopper_package_status()
       │    └─ create_notification_with_direct_email()
       │         └─ INSERT notificación + net.http_post (email Resend) + net.http_post (WhatsApp)
       ├─ TRIGGER: update_trip_payment_accumulator()
       │    └─ Cálculos + queries sobre paquetes del viaje
       ├─ TRIGGER: set_assignment_expiration()
       │    └─ Busca/actualiza expiración
       ├─ TRIGGER: trg_sync_legacy_fields_from_products_data()
       ├─ TRIGGER: packages_apply_quote_pricing()
       └─ TRIGGER: zzzz_auto_approve_prime_payments()
```

### El problema específico

Aunque `net.http_post` es "asíncrono" (no-blocking para la respuesta HTTP), **la ejecución de cada función trigger sí es síncrona dentro de la transacción**. Esto significa:

1. **Cada trigger ejecuta queries adicionales** (buscar perfil, verificar preferencias, construir email HTML, etc.)
2. **`notify_shopper_package_status` llama a `create_notification_with_direct_email`** que hace 3-4 queries de perfil + 2 llamadas `net.http_post` (Resend + WhatsApp)
3. **`notify_traveler_package_status` también crea notificación + email** — pero cuando el status cambia a `matched`, `matched_trip_id` sigue siendo NULL (en multi-assignment), así que probablemente no encuentra traveler_id y no hace nada útil, pero sí ejecuta la query de lookup
4. **`update_trip_payment_accumulator`** se dispara en CADA update de packages, aunque el cambio a 'matched' no sea relevante para pagos
5. **Todos estos triggers corren en serie** dentro de la misma transacción del RPC

### Estimación del impacto
- 6-8 triggers ejecutándose secuencialmente
- Cada uno con 1-4 queries propias
- Total: ~15-25 queries adicionales por match
- Con latencia de red a Supabase: **3-8 segundos** fácilmente

### Solución propuesta

**Optimizar los triggers para que salgan temprano (early return) cuando el cambio no es relevante:**

1. **`update_trip_payment_accumulator`**: Agregar guard al inicio — solo ejecutar si el status cambia a `delivered_to_office`, `completed`, etc. Actualmente se ejecuta en CADA update de packages sin importar qué campo cambió.

2. **`notify_traveler_package_status`**: Ya tiene lógica condicional pero ejecuta una query de lookup de trip/perfil ANTES de verificar si hay algo que notificar. Mover el check de `OLD.status != NEW.status` al inicio.

3. **`notify_shopper_package_status`**: Similar — verificar primero si el cambio de status es relevante antes de hacer el lookup del perfil.

4. **`set_assignment_expiration`**: Verificar que solo se ejecute cuando status cambia a 'matched'.

5. **`packages_apply_quote_pricing`**: Solo relevante cuando cambia `quote` o `delivery_method`, pero el trigger ya está definido con `UPDATE OF quote, delivery_method`, así que no debería dispararse en este caso.

### Cambios técnicos

Se crearían **1-2 migraciones SQL** para actualizar las funciones de los triggers más pesados:

- `update_trip_payment_accumulator`: Agregar `IF OLD.status = NEW.status OR NEW.status NOT IN ('delivered_to_office','completed',...) THEN RETURN NEW; END IF;` al inicio
- `notify_traveler_package_status`: Mover el check de status relevante ANTES de la query de profiles/trips
- `notify_shopper_package_status`: Mismo patrón — early return si el cambio de status no es uno que requiera notificación

Esto debería reducir el tiempo del match de **5-10 segundos a 1-2 segundos** al eliminar ~80% de las queries innecesarias que se ejecutan en cada update.

