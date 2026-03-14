

## Fix: Toasts no respetan safe area en móvil

### Problema
El `ToastViewport` usa `fixed top-0` en móvil, posicionándose detrás del notch.

### Cambio
**`src/components/ui/toast.tsx`** (línea 17): Agregar `pt-[env(safe-area-inset-top)]` al className del ToastViewport para que en móvil los toasts aparezcan debajo del notch.

Cambiar:
```
"fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
```
A:
```
"fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
```
Con inline style `paddingTop: 'env(safe-area-inset-top, 0px)'` en el viewport (solo aplica en móvil con `top-0`, en desktop usa `sm:top-auto` con bottom).

