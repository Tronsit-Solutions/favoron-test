
## Mostrar Paquetes Cancelados en Perfil de Usuario Admin

### Problema Identificado
El hook `useAdminData.tsx` excluye paquetes con status `cancelled`, `rejected`, `quote_rejected`, y `quote_expired` para optimizar rendimiento del dashboard admin (linea 167). Sin embargo, esto causa que al ver el perfil de un usuario, su historial de pedidos este incompleto.

---

### Solucion Propuesta

Modificar el componente `UserDetailModal.tsx` para que cargue los paquetes del usuario directamente desde la base de datos cuando se abre, en lugar de depender de la data pre-filtrada del admin dashboard.

---

### Cambios Tecnicos

#### 1. UserDetailModal.tsx - Agregar carga directa de paquetes

Agregar estado y efecto para cargar paquetes del usuario directamente:

```tsx
// Nuevo estado para paquetes cargados directamente
const [loadedUserPackages, setLoadedUserPackages] = useState<Package[]>([]);
const [loadingPackages, setLoadingPackages] = useState(false);

// Efecto para cargar TODOS los paquetes del usuario (incluyendo cancelados)
useEffect(() => {
  const loadUserPackages = async () => {
    if (!profileId || !isOpen) return;
    
    setLoadingPackages(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoadedUserPackages(data || []);
    } catch (error) {
      console.error('Error loading user packages:', error);
    } finally {
      setLoadingPackages(false);
    }
  };

  loadUserPackages();
}, [profileId, isOpen]);

// Usar paquetes cargados directamente en lugar de los filtrados
const userPackages = loadedUserPackages.length > 0 
  ? loadedUserPackages 
  : packages.filter(pkg => pkg.user_id === (profileId || ''));
```

#### 2. UserPackagesTab.tsx - Agregar indicador de paquetes cancelados

Actualizar el componente para mostrar visualmente los paquetes cancelados:

```tsx
// En la fila de cada paquete, agregar indicador visual para cancelados
<TableRow key={pkg.id} className={pkg.status === 'cancelled' ? 'opacity-60 bg-red-50/30' : ''}>
```

---

### Flujo Resultante

```text
┌──────────────────────────────────────────────────────┐
│  Admin abre perfil de usuario                        │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│  useEffect detecta profileId + isOpen                │
│  → Ejecuta query directo a packages                  │
│  → SIN filtro de status (incluye cancelled)          │
└──────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│  Tab "Pedidos" muestra TODOS los paquetes            │
│  → Activos con estilo normal                         │
│  → Cancelados con fondo rojo suave + opacity         │
└──────────────────────────────────────────────────────┘
```

---

### Archivos a Modificar

1. **src/components/admin/UserDetailModal.tsx**
   - Agregar import de supabase
   - Agregar useState para loadedUserPackages y loadingPackages
   - Agregar useEffect para cargar paquetes directamente
   - Modificar userPackages para usar datos cargados

2. **src/components/admin/UserPackagesTab.tsx**
   - Agregar prop loadingPackages opcional
   - Agregar estilo visual para paquetes cancelados
   - Mostrar spinner mientras carga

---

### Ventajas de Esta Solucion

- No afecta rendimiento del dashboard admin general
- Solo carga datos adicionales cuando se necesitan (al abrir perfil)
- Muestra historial completo incluyendo cancelados
- Distincion visual clara entre activos y cancelados
