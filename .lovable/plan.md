
## Cargar viajes directamente en UserDetailModal

### Problema
El modal de detalle de usuario filtra los viajes desde un array global `trips` que solo contiene un subconjunto de los viajes del sistema. El viaje de Nathalie (Chicago -> Guatemala City, ID: fc67fcb5-ed97-4236-911a-fc12908e3816) existe en la base de datos pero no está incluido en ese array.

### Solución
Agregar carga directa de viajes del usuario desde la base de datos, similar a como ya se cargan los paquetes en el mismo modal (líneas 109-131).

### Cambios en src/components/admin/UserDetailModal.tsx

#### 1. Agregar estado para viajes cargados directamente
```tsx
// Línea 89-91 (junto a los estados de paquetes)
const [loadedUserPackages, setLoadedUserPackages] = useState<Package[]>([]);
const [loadingPackages, setLoadingPackages] = useState(false);

// NUEVO: Estado para viajes
const [loadedUserTrips, setLoadedUserTrips] = useState<Trip[]>([]);
const [loadingTrips, setLoadingTrips] = useState(false);
```

#### 2. Agregar useEffect para cargar viajes del usuario
```tsx
// Después del useEffect de paquetes (línea 131)
useEffect(() => {
  const loadUserTrips = async () => {
    if (!profileId || !isOpen) return;
    
    setLoadingTrips(true);
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoadedUserTrips((data || []) as Trip[]);
    } catch (error) {
      console.error('Error loading user trips:', error);
    } finally {
      setLoadingTrips(false);
    }
  };

  loadUserTrips();
}, [profileId, isOpen]);
```

#### 3. Usar viajes cargados directamente como fuente principal
```tsx
// Modificar línea 106
// ANTES:
const userTrips = trips.filter(trip => trip.user_id === (profileId || ''));

// DESPUÉS:
const userTrips = loadedUserTrips.length > 0 
  ? loadedUserTrips 
  : trips.filter(trip => trip.user_id === (profileId || ''));
```

#### 4. Pasar estado de carga a UserTripsTab
```tsx
// Modificar línea 419
<UserTripsTab trips={userTrips} allPackages={allPackages} loadingTrips={loadingTrips} />
```

#### 5. Actualizar UserTripsTab para mostrar loading
En src/components/admin/UserTripsTab.tsx:
- Agregar prop `loadingTrips?: boolean`
- Mostrar spinner cuando `loadingTrips` es true

### Resultado esperado
Al abrir el perfil de Nathalie Ramazzini:
- Se cargarán sus viajes directamente desde la base de datos
- Se mostrará el viaje Chicago -> Guatemala City (estado: approved)
- Funcionará independientemente del subconjunto de viajes cargados globalmente
