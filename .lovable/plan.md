

## Agregar seccion de Preguntas Frecuentes al Landing Page

### Que se agrega
Una nueva seccion de FAQ con accordion, ubicada entre la seccion de "Por que elegir Favoron" (BenefitsSection) y la seccion azul de CTA. Usara las mismas preguntas que ya existen en el SupportBubble, mas algunas adicionales relevantes.

### Cambios

**Nuevo archivo: `src/components/FAQSection.tsx`**

- Seccion con titulo "Preguntas Frecuentes" usando el mismo estilo visual del landing (gradientes, tipografia)
- Accordion con las preguntas del SupportBubble mas preguntas adicionales:
  1. Como funciona Favoron?
  2. Cuanto cuesta el servicio?
  3. Cuanto tarda mi pedido?
  4. Como me registro como viajero?
  5. Que pasa si mi pedido se dana?
  6. Es seguro usar Favoron?
  7. Que productos puedo enviar?
- Usa los componentes existentes de Radix UI Accordion (`@/components/ui/accordion`)
- Fondo consistente con las demas secciones (gradiente claro, blur decorativo)
- Responsive: una columna en movil, contenido centrado con max-w

**Archivo modificado: `src/pages/Index.tsx`**

- Importar FAQSection (lazy con retry, igual que las demas secciones)
- Colocarlo entre BenefitsSection y CTASection, envuelto en Suspense

### Estructura visual

```text
... BenefitsSection ...
+------------------------------------------+
|                                          |
|       Preguntas Frecuentes               |
|   Resuelve tus dudas antes de empezar    |
|                                          |
|  [v] Como funciona Favoron?              |
|  [>] Cuanto cuesta el servicio?          |
|  [>] Cuanto tarda mi pedido?             |
|  [>] Como me registro como viajero?      |
|  [>] Que pasa si mi pedido se dana?      |
|  [>] Es seguro usar Favoron?             |
|  [>] Que productos puedo enviar?         |
|                                          |
+------------------------------------------+
... CTASection (seccion azul) ...
```

