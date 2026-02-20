

## Burbuja flotante de Soporte (FAQ + WhatsApp)

### Descripcion
Crear un componente flotante fijo en la esquina inferior derecha de la pantalla con un icono de soporte. Al hacer clic, se expande un pequeno panel con preguntas frecuentes (FAQ) y un boton para redirigir a WhatsApp.

### Cambios tecnicos

**Nuevo archivo: `src/components/SupportBubble.tsx`**
- Boton circular flotante con `position: fixed`, `bottom-6 right-6`, `z-50`
- Icono de `Headphones` o `MessageCircle` de lucide-react
- Al hacer clic, abre un panel pequeno encima del boton con:
  - Titulo "Soporte"
  - Lista de 4-5 preguntas frecuentes colapsables (usando Collapsible o Accordion de shadcn)
  - Boton verde "Escribenos por WhatsApp" que redirige a `https://wa.me/50230616015` con un mensaje predeterminado
- Al hacer clic fuera o en el boton de cerrar, el panel se cierra
- Animacion suave de entrada/salida

**Preguntas frecuentes sugeridas** (editables despues):
1. "Como funciona Favoron?" - Explicacion breve del servicio
2. "Cuanto cuesta el servicio?" - Informacion sobre comisiones
3. "Cuanto tarda mi pedido?" - Tiempos estimados
4. "Como me registro como viajero?" - Pasos para viajeros
5. "Que pasa si mi pedido se dana?" - Politica de proteccion

**Archivo: `src/App.tsx`**
- Importar y renderizar `<SupportBubble />` dentro del layout principal, fuera de las rutas, para que aparezca en todas las paginas
- Colocarlo despues de `</Routes>` y antes del cierre de `PlatformFeesProvider`

### Detalles de diseno
- Burbuja: circulo de 56px, color primario (azul Favoron), sombra elevada
- Panel: ancho ~320px, maximo 400px de alto con scroll, bordes redondeados, sombra
- En mobile: el panel ocupa casi todo el ancho con margen lateral de 16px
- El boton de WhatsApp usa color verde (`bg-green-500`) con icono de `MessageCircle`

