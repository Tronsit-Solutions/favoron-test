
## Diagnóstico: Por qué el landing page tarda en cargar

### Problema encontrado

El landing page tiene un **bloqueo total de renderizado** mientras espera que la autenticación se complete. Esto significa que:

1. **Usuario con sesión existente**: Espera mínimo **~1.5 segundos** antes de ver cualquier contenido:
   - 600ms delay intencional para compatibilidad iOS Safari (línea 115 de useAuth.tsx)
   - 100ms delay adicional entre requests de perfil y roles  
   - Tiempo de red para 2 llamadas a Supabase (`profiles` + `user_roles`)
   - Tiempo de procesamiento

2. **Usuario nuevo (sin sesión)**: También espera porque `loading` inicia en `true` y solo cambia después de verificar `getSession()`.

### Código actual problemático

```tsx
// src/pages/Index.tsx línea 40-49
if (loading) {
  return (
    <div className="min-h-screen...">
      <div>Cargando...</div>  // ← BLOQUEA TODO hasta que auth termine
    </div>
  );
}
```

El flujo actual:

```text
┌─────────────────────────────────────────────────────────────┐
│ Usuario abre favoron.app                                     │
├─────────────────────────────────────────────────────────────┤
│  loading=true → "Cargando..."                                │
│  ↓                                                           │
│  getSession() → ¿Tiene sesión?                               │
│  ↓                                                           │
│  SÍ: loadProfile() → 600ms delay + 2 queries + 100ms delay   │
│  NO: setLoading(false) (rápido)                              │
│  ↓                                                           │
│  loading=false → Se renderiza el landing page                │
└─────────────────────────────────────────────────────────────┘
```

### Solución propuesta: Mostrar landing inmediatamente

Cambiar la arquitectura para que el landing page se muestre **inmediatamente** sin esperar autenticación. La personalización (nombre del usuario, menú de cuenta) puede aparecer después.

#### Cambio en Index.tsx

Eliminar el bloqueo por `loading` y mostrar un estado "cargando" solo en el NavBar:

```tsx
// ANTES (bloquea todo)
if (loading) {
  return <LoadingSpinner />;
}

// DESPUÉS (renderiza inmediatamente)
// Eliminar este if completamente
// El NavBar maneja su propio estado de loading
```

#### Cambio en NavBar.tsx

Mostrar un skeleton/placeholder mientras carga en lugar de ocultar los botones:

```tsx
// Cuando loading=true, mostrar skeleton discreto
{loading ? (
  <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
) : isAuthenticated ? (
  // Menú de usuario...
) : (
  // Botones login/registro...
)}
```

#### Cambio en HeroSection.tsx

Mostrar versión genérica mientras carga, luego actualizar con nombre:

```tsx
// No depender del loading state para mostrar contenido
// Mostrar título genérico "Conectamos compradores con viajeros"
// Si después loading=false y hay userName, actualizar el saludo
```

### Resultado esperado

```text
┌─────────────────────────────────────────────────────────────┐
│ Usuario abre favoron.app                                     │
├─────────────────────────────────────────────────────────────┤
│  → Landing page visible INMEDIATAMENTE (~100ms)              │
│  → NavBar muestra skeleton/placeholder                       │
│  → Hero muestra versión genérica                             │
│  ↓                                                           │
│  (en background) getSession() + loadProfile()                │
│  ↓                                                           │
│  loading=false → NavBar actualiza con avatar/menú            │
│  → Hero actualiza con "¡Bienvenido, Lucas!"                  │
└─────────────────────────────────────────────────────────────┘
```

### Archivos a modificar

1. **`src/pages/Index.tsx`**: Eliminar el guard de loading
2. **`src/components/NavBar.tsx`**: Agregar skeleton state para cuando loading=true
3. **`src/components/HeroSection.tsx`**: Mostrar versión genérica por defecto

### Beneficios

- El landing page se ve instantáneamente (mejora percepción de velocidad)
- Los datos del usuario aparecen progresivamente cuando están listos
- Mantiene toda la funcionalidad actual
- No afecta rutas protegidas (Dashboard sigue requiriendo auth)

### Sección técnica

El delay de 600ms en `useAuth.tsx` (línea 113-115) es necesario para iOS Safari y no debe eliminarse. La solución es hacer que el landing no dependa de este delay para mostrarse.

La estrategia es conocida como "skeleton loading" o "progressive hydration" - mostrar UI inmediatamente con placeholders y reemplazarlos cuando los datos están listos.
