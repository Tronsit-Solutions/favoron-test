

## Plan: Eliminar flash de Dialog al abrir formularios en movil

### Causa raiz

`useIsMobile()` inicializa `isMobile` como `undefined` (linea 6 de `use-mobile.tsx`). El `!!undefined` devuelve `false`, asi que en el primer render se muestra el `Dialog`. Luego el `useEffect` corre, detecta que es movil, cambia a `true`, y se re-renderiza con el `Sheet`. Esto causa el flash del modal por un microsegundo.

### Solucion

**Archivo**: `src/hooks/use-mobile.tsx`

Inicializar el estado con el valor correcto desde el primer render usando una funcion lazy que lee `window.innerWidth` de forma sincrona:

```typescript
const [isMobile, setIsMobile] = React.useState<boolean | undefined>(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  return undefined;
})
```

Esto elimina el render intermedio donde `isMobile` es `false` y se muestra el Dialog.

### Impacto
- Un solo archivo modificado
- Afecta positivamente todos los componentes que usan `useIsMobile` (PackageRequestForm, TripForm, etc.)
- Sin cambios visuales en desktop ni en mobile, solo elimina el flash

