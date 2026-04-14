

## Plan: Mover OnboardingBottomSheet fuera de TabsContent

### Problema
Ambos `OnboardingBottomSheet` (shopper y traveler) estan dentro de `TabsContent value="trips"` (lineas 1109-1125). El boton de onboarding de pedidos esta en `TabsContent value="packages"` (linea 857), pero el modal que debe abrir vive en otra pestaña. Cuando haces click, el estado se actualiza pero el componente no esta montado. Solo aparece al cambiar a la pestaña de viajes.

### Solucion
Mover ambos `OnboardingBottomSheet` fuera de todos los `TabsContent`, colocandolos justo despues del cierre del componente `Tabs` (despues de `</Tabs>`). Como son modales (Dialog), no necesitan estar dentro de ninguna pestaña especifica.

### Cambio unico en `src/components/Dashboard.tsx`
- Cortar las lineas 1109-1125 (ambos `OnboardingBottomSheet`)
- Pegarlas fuera del bloque `<Tabs>`, al mismo nivel que otros modales globales del dashboard

Sin otros archivos afectados.

