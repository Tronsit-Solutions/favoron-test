

## Plan: Rediseño Landing Page — Clean & Minimal

### Problema actual
La landing page tiene muchos elementos que se ven "AI-generated": gradientes radiales animados, glows, blur backgrounds, `backdrop-blur`, `hover:scale-105` en todo, gradient text (`bg-clip-text text-transparent`), y decorative circles con `blur-3xl`. Esto crea un look genérico que no transmite confianza.

### Dirección: Clean & Minimal (estilo Linear/Stripe)
- Fondos planos (blanco o gris muy claro `gray-50`)
- Sin gradientes decorativos, sin glows, sin blur backgrounds
- Sin `hover:scale-105` en cards
- Tipografía fuerte en negro/gris oscuro — sin gradient text
- Borders sutiles (`border-gray-200`), shadows leves (`shadow-sm`)
- Más whitespace, menos decoración
- Los colores de marca (shopper/traveler) se usan como acentos puntuales, no como gradientes

### Archivos a modificar (8 componentes + CSS)

**1. `src/components/HeroSection.tsx`**
- Fondo: blanco plano, sin radial gradients ni grid patterns
- Trust bar: simplificar a texto plano con separadores, sin card con backdrop-blur
- Título: texto negro sólido, sin gradient text. Solo el nombre del usuario o "compradores" en color de marca
- Stats cards: border sutil, sin `shadow-glow`, sin `hover:scale-105`
- Quitar todos los divs decorativos de background

**2. `src/components/PlatformDescriptionSection.tsx`**
- Fondo: `bg-white` o `bg-gray-50`
- Quitar circles animados con `animate-pulse`
- Feature cards: border simple, sin `surface-glass`, sin `shadow-glow`, sin hover scale
- Título: negro sólido, "Favorón" en color primario sin gradient

**3. `src/components/TravelsHubSection.tsx`**
- Quitar blobs decorativos (3 divs absolutos)
- Fondo plano `bg-gray-50`
- Título sin gradient text

**4. `src/components/HowItWorksSection.tsx`**
- Quitar background blobs
- Cards: fondo blanco, border sutil, sin gradient backgrounds, sin hover scale
- Títulos en color sólido (shopper/traveler), sin `bg-clip-text`

**5. `src/components/BenefitsSection.tsx`**
- Quitar background blobs
- Cards más simples: icon + título + texto, sin gradient icon containers
- Quitar trust indicators duplicados al final (ya están en el hero)
- Sin hover scale ni animated bottom borders

**6. `src/components/FAQSection.tsx`**
- Ya está relativamente limpio. Quitar blobs de fondo
- Fondo blanco plano

**7. `src/components/CTASection.tsx`**
- Simplificar: fondo sólido (color primario o gris oscuro), sin gradientes multicapa
- Quitar airplane decorativo y blobs
- Texto blanco limpio, un solo CTA button

**8. `src/components/NavBar.tsx`**
- Quitar gradient overlay (`from-blue-50/30 via-transparent to-purple-50/30`)
- Nav simple: `bg-white border-b border-gray-200`

**9. `src/index.css`**
- Los utility classes `.shadow-glow`, `.surface-glass` pueden quedarse definidos (se usan en otros lados del app) pero se removerán del landing page

**10. `src/pages/Index.tsx`**
- Cambiar el wrapper de `bg-gradient-to-br from-blue-50 to-white` a `bg-white`
- Cambiar fallbacks de Suspense de animated pulse gradients a simples `bg-white`

### Lo que NO cambia
- Estructura de secciones (todas se mantienen)
- Funcionalidad (auth, navigation, stats hook, trips, customer photos)
- Footer (ya está limpio)
- Componentes internos como `AvailableTripsCard`, `CustomerPhotosSection` (se mantienen)

### Resultado esperado
Un landing page que se siente diseñado por humanos: limpio, con jerarquía tipográfica clara, whitespace generoso, y acentos de color puntuales. Sin efectos decorativos que griten "AI template".

