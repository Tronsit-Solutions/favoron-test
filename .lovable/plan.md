

## Cambiar iconos de onboarding a algo más atractivo

### Cambio
Reemplazar el icono `HelpCircle` (?) por `BookOpen` de Lucide en ambos botones de onboarding (shoppers y viajeros). `BookOpen` comunica mejor "guía/tutorial" y es más atractivo visualmente que un signo de interrogación.

### Archivo: `src/components/Dashboard.tsx`

1. **Import**: Reemplazar `HelpCircle` por `BookOpen` en la línea de imports de lucide-react
2. **Línea ~858**: Cambiar `<HelpCircle className="h-4 w-4" />` → `<BookOpen className="h-4 w-4" />` (botón shoppers)
3. **Línea ~961**: Cambiar `<HelpCircle className="h-4 w-4" />` → `<BookOpen className="h-4 w-4" />` (botón viajeros)

