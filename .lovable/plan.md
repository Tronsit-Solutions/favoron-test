

## Fix: Matching lento + "Cargando" bloquea tips

### Problemas identificados

1. **"Cargando..." bloquea el botón de tips** — `usePackageDetails` siempre hace un fetch a la DB aunque `selectedPackage` ya tiene `products_data`. El botón queda disabled hasta que ese fetch termine.

2. **Console.logs de debug en cada render** — `getProductsForModal()` tiene 6 `console.log` que se ejecutan cada vez que se llama (líneas 709-733).

3. **3 queries Supabase secuenciales al abrir el dialog** — Los useEffects de líneas 408, 434 y 496 lanzan queries independientes que podrían correr en paralelo.

### Solución

#### 1) `AdminMatchDialog.tsx` — No bloquear tips si ya hay datos

Cambiar la lógica del botón "Asignar Tips": habilitarlo inmediatamente si `selectedPackage.products_data` ya existe, sin esperar a `usePackageDetails`. Solo mostrar "Cargando" si NO hay `products_data` en el paquete local Y el fetch está en curso.

```tsx
// Línea 1661: cambiar disabled condition
disabled={!fullPackage?.products_data && loadingDetails}

// Línea 1664: cambiar texto
{(!fullPackage?.products_data && loadingDetails) ? 'Cargando...' : `Asignar Tips...`}
```

#### 2) `AdminMatchDialog.tsx` — Eliminar console.logs de debug

Eliminar los 6 `console.log` dentro de `getProductsForModal()` (líneas 709-733).

#### 3) `AdminMatchDialog.tsx` — Paralelizar queries iniciales

Combinar los 3 useEffects separados (fetch existing assignments, fetch trip assignments map, fetch traveler profiles) en un solo useEffect que lance las 3 queries con `Promise.all` cuando el dialog se abre.

### Archivos
- **Modificar**: `src/components/admin/AdminMatchDialog.tsx`

