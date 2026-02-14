

## Arreglar logging en ambos flujos de rechazo de cotización

### Problema
Cuando un shopper rechaza una cotización, hay dos flujos en `useDashboardActions.tsx`:

1. **Flujo principal (lineas ~440-476)**: Ya guarda `rejected_traveler` en `quote_rejection`, pero NO escribe en `admin_actions_log`.
2. **Flujo legacy (lineas ~668-675)**: No guarda nada del viajero previo. Solo limpia `matched_trip_id`, `quote`, etc.

### Cambios

**Archivo: `src/hooks/useDashboardActions.tsx`**

#### Flujo principal (~linea 440-476)
- Agregar una entrada en `admin_actions_log` con:
  - `action_type: 'quote_rejection'`
  - `previous_trip_id`
  - `previous_traveler_id`
  - `previous_traveler_name`
  - `rejection_reason`
  - `wants_requote`
  - `timestamp`
- Se construira el nuevo log concatenando al array existente de `admin_actions_log` del paquete.

#### Flujo legacy (~linea 668-675)
- Antes de limpiar los campos, obtener la info del viajero asignado usando el `matched_trip_id` actual del paquete (via RPC `get_trip_with_traveler_info` o query directo).
- Guardar `quote_rejection` con `rejected_traveler` (igual que el flujo principal).
- Agregar entrada en `admin_actions_log` con los mismos datos.
- Mantener la limpieza de `matched_trip_id`, `quote`, `traveler_address`, `matched_trip_dates`.

### Detalles tecnicos

Para escribir en `admin_actions_log` sin perder entradas previas, se leera el valor actual del paquete desde el estado local (`packages.find(...)`) y se hara `append` al array antes de enviar el update. El formato de la entrada sera consistente con el que ya usa `traveler_reject_assignment`:

```text
{
  action_type: 'quote_rejection',
  previous_trip_id: string,
  previous_traveler_id: string,
  previous_traveler_name: string,
  rejection_reason: string,
  wants_requote: boolean,
  timestamp: ISO string
}
```

No se requieren cambios en la base de datos ni migraciones.

