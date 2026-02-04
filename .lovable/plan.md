

## Mostrar Nombre del Viajero y Historial de Rechazos

### Problema Actual

El codigo actual (lineas 1064-1081) intenta mostrar el nombre del viajero que rechazo buscando en el array de `trips`:

```tsx
const rejectedById = (pkg.traveler_rejection as any)?.rejected_by;
const rejectorTrip = trips?.find(trip => trip.user_id === rejectedById);
const rejectorProfile = rejectorTrip?.profiles;
```

Esto falla cuando:
- El viajero ya no tiene viajes activos
- El viaje fue eliminado o completado

Ademas, solo muestra el ultimo rechazo, no el historial completo guardado en `admin_actions_log`.

---

### Solucion

1. **Cargar perfiles de viajeros directamente** - Consultar la tabla `profiles` usando los IDs de viajeros que han rechazado
2. **Mostrar historial completo** - Parsear `admin_actions_log` y mostrar todos los rechazos con nombres

---

### Cambios Tecnicos

**Archivo: src/components/admin/PackageDetailModal.tsx**

#### 1. Agregar estado para perfiles de rechazadores (despues de linea 208)

```tsx
// State for rejection history profiles
const [rejectionProfiles, setRejectionProfiles] = useState<Record<string, any>>({});
const [loadingRejectionProfiles, setLoadingRejectionProfiles] = useState(false);
```

#### 2. Agregar useEffect para cargar perfiles (despues de linea 290)

```tsx
// Load profiles for rejection history
useEffect(() => {
  const loadRejectionProfiles = async () => {
    if (!isOpen || !pkg) return;
    
    // Collect all traveler IDs from rejection history
    const travelerIds = new Set<string>();
    
    // From admin_actions_log
    if (pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log)) {
      pkg.admin_actions_log.forEach((log: any) => {
        if (log.action_type === 'traveler_rejection') {
          const travelerId = log.additional_data?.previous_traveler_id || log.admin_id;
          if (travelerId) travelerIds.add(travelerId);
        }
      });
    }
    
    // From current traveler_rejection
    const currentRejectorId = (pkg.traveler_rejection as any)?.previous_traveler_id;
    if (currentRejectorId) travelerIds.add(currentRejectorId);
    
    if (travelerIds.size === 0) return;
    
    setLoadingRejectionProfiles(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, username, email')
        .in('id', Array.from(travelerIds));
      
      if (error) {
        console.error('Error loading rejection profiles:', error);
      } else if (data) {
        const profileMap: Record<string, any> = {};
        data.forEach(profile => {
          profileMap[profile.id] = profile;
        });
        setRejectionProfiles(profileMap);
      }
    } catch (error) {
      console.error('Exception loading rejection profiles:', error);
    } finally {
      setLoadingRejectionProfiles(false);
    }
  };
  
  loadRejectionProfiles();
}, [pkg?.id, pkg?.admin_actions_log, pkg?.traveler_rejection, isOpen]);
```

#### 3. Actualizar la seccion de rechazo de viajero (reemplazar lineas 1054-1106)

```tsx
{/* Traveler Rejection Info - Show when traveler rejected the assignment */}
{pkg.traveler_rejection && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
    <div className="flex items-start space-x-3">
      <XCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 space-y-3">
        <div>
          <h4 className="font-semibold text-orange-900 mb-1">Viajero Rechazo la Asignacion</h4>
          
          {/* Traveler Name - usando perfil cargado directamente */}
          {(() => {
            const rejectorId = (pkg.traveler_rejection as any)?.previous_traveler_id;
            const profile = rejectionProfiles[rejectorId];
            
            if (profile) {
              return (
                <div className="mb-2 flex items-center space-x-2">
                  <User className="h-4 w-4 text-orange-700" />
                  <p className="text-sm font-medium text-orange-900">
                    Viajero: {profile.first_name} {profile.last_name}
                    <span className="text-orange-600 ml-1">(@{profile.username})</span>
                  </p>
                </div>
              );
            } else if (rejectorId) {
              return (
                <div className="mb-2 flex items-center space-x-2">
                  <User className="h-4 w-4 text-orange-700" />
                  <p className="text-sm text-orange-700">
                    ID del viajero: {rejectorId.substring(0, 8)}...
                  </p>
                </div>
              );
            }
            return null;
          })()}
          
          <p className="text-sm text-orange-800">
            <span className="font-medium">Motivo: </span>
            {translateRejectionReason((pkg.traveler_rejection as any)?.reason || (pkg.traveler_rejection as any)?.rejection_reason)}
          </p>
        </div>
        
        {(pkg.traveler_rejection as any)?.additional_comments && (
          <div className="bg-orange-100 rounded-md p-3">
            <p className="text-xs font-medium text-orange-900 mb-1">Comentarios del viajero:</p>
            <p className="text-xs text-orange-800">
              {(pkg.traveler_rejection as any).additional_comments}
            </p>
          </div>
        )}
        
        <div className="pt-2 border-t border-orange-300">
          <p className="text-xs text-orange-700">
            Rechazado el {formatSafeDateTime((pkg.traveler_rejection as any)?.rejected_at || pkg.updated_at)}
          </p>
        </div>
      </div>
    </div>
  </div>
)}

{/* Historial completo de rechazos */}
{pkg.admin_actions_log && Array.isArray(pkg.admin_actions_log) && (() => {
  const rejections = pkg.admin_actions_log.filter(
    (log: any) => log.action_type === 'traveler_rejection'
  );
  
  if (rejections.length <= 1) return null; // Solo mostrar si hay mas de 1 rechazo
  
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
      <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Historial de Rechazos ({rejections.length} viajeros)
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {rejections.map((log: any, idx: number) => {
          const travelerId = log.additional_data?.previous_traveler_id || log.admin_id;
          const profile = rejectionProfiles[travelerId];
          
          return (
            <div key={idx} className="bg-white/70 rounded p-2 text-sm border border-amber-100">
              <div className="flex items-center justify-between">
                <span className="font-medium text-amber-900">
                  {profile 
                    ? `${profile.first_name} ${profile.last_name} (@${profile.username})`
                    : `Viajero ${travelerId?.substring(0, 8)}...`
                  }
                </span>
                <span className="text-xs text-amber-600">
                  {formatSafeDateTime(log.timestamp)}
                </span>
              </div>
              {log.additional_data?.rejection_reason && (
                <p className="text-xs text-amber-700 mt-1">
                  Motivo: {translateRejectionReason(log.additional_data.rejection_reason)}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
})()}
```

---

### Resultado

1. **Nombre del viajero siempre visible** - Se carga directamente de `profiles` usando el ID, sin depender del array de trips
2. **Historial completo** - Si un paquete fue rechazado por multiples viajeros, se muestra la lista completa con fechas y motivos
3. **Fallback graceful** - Si por alguna razon no se puede cargar el perfil, se muestra el ID truncado

