

## Plan: Cambiar formularios de modal a pagina completa en movil

### Problema
En movil, PackageRequestForm y TripForm se abren como Dialog (modal centrado con overlay), lo cual se siente pesado y poco nativo en pantallas pequenas.

### Solucion
En movil (< 768px), reemplazar el Dialog por un Sheet que sube desde abajo ocupando el 100% de la pantalla, creando una experiencia tipo "nueva pagina". En desktop, mantener el Dialog actual sin cambios.

### Cambios concretos

**1. `src/components/PackageRequestForm.tsx`**
- Importar `useIsMobile` y `Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription` 
- En `renderPackageForm()`, condicionar por `isMobile`:
  - **Movil**: Usar `<Sheet open={isOpen} onOpenChange={...}>` con `<SheetContent side="bottom" className="h-full max-h-full rounded-t-xl">` para que ocupe toda la pantalla deslizando desde abajo
  - **Desktop**: Mantener el `<Dialog>` actual tal cual
- Extraer el contenido interno (header, steps, navigation buttons) a una variable compartida para evitar duplicacion

**2. `src/components/TripForm.tsx`**
- Mismo patron: importar `useIsMobile`, Sheet components
- En `renderTripForm()`, condicionar por `isMobile`:
  - **Movil**: Sheet full-screen desde abajo
  - **Desktop**: Dialog actual

**3. `src/components/ui/sheet.tsx`**
- Agregar variante `bottom` al `sheetVariants` con: `inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom` (ya existe en el cva pero verificar que soporte height completo)

### Estructura del Sheet movil (ambos forms)

```text
<Sheet open={isOpen} onOpenChange={...}>
  <SheetContent side="bottom" className="h-[100dvh] max-h-[100dvh] p-0 rounded-t-2xl flex flex-col">
    <SheetHeader className="px-6 pt-6 pb-2 flex-shrink-0">
      <SheetTitle>...</SheetTitle>
      <SheetDescription>...</SheetDescription>
    </SheetHeader>
    <StepIndicator />
    <div className="flex-1 overflow-y-auto px-6">
      {step content}
    </div>
    <div className="flex-shrink-0 p-4 border-t">
      {navigation buttons}
    </div>
  </SheetContent>
</Sheet>
```

### Impacto
- Experiencia movil tipo app nativa (slide-up full page)
- Desktop sin cambios
- No afecta logica de submit, autosave, ni modal state

