

## Agregar botón "Cerrar simulación" en CompleteProfile

### Cambio — `src/pages/CompleteProfile.tsx`

Cuando `isSimulation` es `true`, mostrar un botón en la esquina superior derecha (o debajo del header) que permita al admin salir de la simulación y volver al dashboard.

- Botón con icono `X` y texto "Cerrar simulación"
- Estilo: `variant="outline"` o ghost, posicionado en el header al lado del logo
- `onClick={() => navigate("/dashboard")}`
- Solo visible cuando `isSimulation === true`

