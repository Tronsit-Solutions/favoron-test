

## Mostrar si el viajero viene de un referido en el perfil del modal

### Cambios

**1. `src/components/admin/AdminMatchDialog.tsx` — Ampliar query de perfiles (línea 423)**

Agregar `referral_code` al select de perfiles de viajeros para poder buscar si fueron referidos.

**2. `src/components/admin/AdminMatchDialog.tsx` — Fetch referral en `handleTravelerClick` (línea 469)**

Cuando se abre el modal del viajero, consultar la tabla `referrals` para ver si el `user_id` del viajero aparece como `referred_id`. Si existe, traer el nombre del referidor desde `profiles`. Guardar esta info en `selectedTraveler`.

```tsx
// En handleTravelerClick, después de setSelectedTraveler:
const { data: referralData } = await supabase
  .from('referrals')
  .select('referrer_id, status')
  .eq('referred_id', trip.user_id)
  .maybeSingle();

if (referralData) {
  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', referralData.referrer_id)
    .single();
  
  setSelectedTraveler(prev => ({
    ...prev,
    referral: {
      referrerName: referrerProfile ? `${referrerProfile.first_name || ''} ${referrerProfile.last_name || ''}`.trim() : 'Desconocido',
      status: referralData.status,
    }
  }));
}
```

**3. `src/components/admin/AdminMatchDialog.tsx` — Mostrar badge en el perfil (después de línea 1633)**

Agregar un nuevo campo en el grid del perfil del viajero con icono `Users` que muestre:
- Si tiene referido: "Referido por [Nombre]" con un badge verde
- Si no: no mostrar nada (campo condicional)

```tsx
{selectedTraveler.referral && (
  <div className="flex items-center space-x-2">
    <Users className="h-4 w-4 text-green-500" />
    <div>
      <p className="text-sm font-medium">Referido por</p>
      <p className="text-sm text-green-600 font-medium">
        {selectedTraveler.referral.referrerName}
      </p>
    </div>
  </div>
)}
```

### Resultado
Cuando un admin abre el perfil de un viajero en el modal de matching, verá inmediatamente si ese viajero fue referido y por quién, permitiendo evaluar la confiabilidad del viajero basándose en quién lo refirió.

