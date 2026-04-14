

## Plan: Corregir doble-click en botones en mobile

### Problema
En dispositivos moviles, los botones dentro de los formularios (PackageRequestForm, TripForm) y onboardings requieren doble toque para funcionar. El primer toque solo activa el estado `:hover` de CSS sin ejecutar el click.

### Causa raiz
Dos factores:

1. **OnboardingBottomSheet**: Usa `react-swipeable` con `preventScrollOnSwipe: true` que intercepta eventos touch y puede bloquear el primer click en botones internos.

2. **Hover states CSS sticky en iOS**: Los botones usan `hover:bg-primary/90`, `hover:bg-logo/90`, etc. sin prefijo `sm:hover:`. En dispositivos tactiles, iOS Safari interpreta el primer toque como hover y requiere un segundo toque para el click real.

### Solucion

**1. `src/index.css`** -- Neutralizar hover states dentro de dialogs/sheets en dispositivos tactiles:
```css
@media (hover: none) and (pointer: coarse) {
  [role="dialog"] button,
  [role="dialog"] [role="combobox"],
  [role="dialog"] [role="option"],
  [role="dialog"] select,
  [role="dialog"] input,
  [role="dialog"] a,
  [role="dialog"] label,
  [role="dialog"] [data-state] {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
    user-select: none;
  }
  
  /* Force disable hover states on touch devices inside dialogs */
  [role="dialog"] button:hover {
    background-color: inherit;
  }
}
```

**2. `src/components/onboarding/OnboardingBottomSheet.tsx`** -- Evitar que el swipe handler intercepte clicks en botones:
- Agregar `delta: 20` al `useSwipeable` para que solo interprete como swipe movimientos de 20px+, no simples toques
- Agregar `touchEventOptions: { passive: true }` para no bloquear eventos nativos
- Envolver botones con `onTouchEnd` + `e.stopPropagation()` para evitar que el swipe handler consuma el evento

**3. `src/components/dashboard/ReferralAnnouncementModal.tsx`** -- Mismo fix de `useSwipeable` con `delta` y `touchEventOptions`

**4. `src/components/ui/button.tsx`** -- Agregar handler `onTouchEnd` nativo para forzar click en dispositivos tactiles cuando el primer toque se consume:
```tsx
const handleTouchEnd = React.useCallback((e: React.TouchEvent) => {
  // Ensure click fires on first tap in mobile
  props.onTouchEnd?.(e);
}, [props.onTouchEnd]);
```

Alternativa mas simple para el boton: agregar clase CSS `cursor-pointer` y asegurar que no hay `user-select: text` en los contenedores padre.

### Archivos a modificar
1. `src/index.css` -- CSS global para neutralizar hover en touch
2. `src/components/onboarding/OnboardingBottomSheet.tsx` -- Fix swipeable config
3. `src/components/dashboard/ReferralAnnouncementModal.tsx` -- Fix swipeable config
4. `src/components/ui/button.tsx` -- Agregar `cursor-pointer` explicitamente

