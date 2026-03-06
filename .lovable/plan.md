

## Fix: Tasa de Conversión en Análisis de Adquisición por Canal

### Problema actual
La tasa de conversión se calcula como `paidPackages / totalUsers * 100`. Esto es incorrecto porque un usuario puede tener múltiples paquetes pagados, inflando la tasa.

### Corrección
Cambiar a `monetizedUsers / totalUsers * 100`, donde "monetized users" son usuarios únicos que tienen al menos un paquete con status pagado.

### Cambios en `src/hooks/useAcquisitionAnalytics.tsx`:
1. Agregar `monetizedUsers: Set<string>` al channelMap (junto a `users`)
2. En el loop de packages, cuando el status es pagado, agregar `pkg.user_id` al set de `monetizedUsers` del canal
3. Cambiar el cálculo de `conversionRate` de `paidPackages / users.size` a `monetizedUsers.size / users.size`
4. Agregar `monetizedUsers: number` al interface `AcquisitionChannelData` para exponerlo en la tabla

