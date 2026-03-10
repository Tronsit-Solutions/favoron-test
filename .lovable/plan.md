

## Plan: Usar el logo correcto en la página "Trabaja con nosotros"

Actualmente el header de `WorkWithUs.tsx` muestra "Favoron" como texto plano. Se reemplazará con la imagen del logo que ya usa el `NavBar` (`/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png`).

### Cambios

**`src/pages/WorkWithUs.tsx`** — En ambos headers (formulario y vista de confirmación), reemplazar el `<Link>` con texto "Favoron" por una imagen:

```tsx
<Link to="/">
  <img src="/lovable-uploads/b4ea91c2-1974-4a3d-b9b6-c538aa52daa7.png" alt="Favorón" className="h-8 sm:h-10 w-auto" />
</Link>
```

