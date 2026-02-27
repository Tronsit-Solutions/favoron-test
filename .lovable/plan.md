

### Cambio en `src/components/Dashboard.tsx`

En la línea 618, el grid muestra `AvailableTripsCard` primero y `ReferralBanner` segundo. En móvil (1 columna), esto pone el Hub de Viajes arriba y Referidos abajo.

**Solución**: Invertir el orden de los componentes y usar `order` de CSS para mantener el orden actual en desktop:

- Líneas 618-623: Poner `ReferralBanner` primero en el DOM (para que en móvil aparezca arriba), y usar `md:order-2` en `ReferralBanner` y `md:order-1` en `AvailableTripsCard` para que en desktop se mantenga el layout actual (Hub izquierda, Referidos derecha).

