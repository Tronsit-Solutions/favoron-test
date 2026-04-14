
Objetivo: eliminar de verdad el “doble tap” en móvil en dashboard, onboardings y formularios.

Hallazgo principal:
- El fix anterior se quedó corto porque el problema no es solo CSS global. Todavía hay varios elementos interactivos con `hover:` y `group-hover:` sin `sm:` en componentes clave, así que en iPhone/Android el primer toque puede quedarse en estado hover.
- Además, en `QuickActions.tsx` el usuario toca un botón visual dentro de una card clickeable, pero ese botón interno no ejecuta la acción. En móvil eso suele causar exactamente este síntoma: primer toque “activa” el botón visual y el segundo finalmente navega.

Plan de corrección

1. Corregir el patrón base de botones en `src/components/ui/button.tsx`
- Cambiar todos los variants de `hover:*` a `sm:hover:*`.
- Mantener `touch-manipulation`, `select-none` y demás utilidades de touch.
- Esto arregla el onboarding button de shoppers, los CTA principales y cualquier botón que use el componente shared.

2. Arreglar los disparadores reales en dashboard
- `src/components/dashboard/QuickActions.tsx`
  - Hacer que el botón visible también tenga `onClick`, o convertir toda la card en un trigger semántico consistente.
  - Evitar el patrón “card clickeable + botón interno sin acción”.
- `src/components/Dashboard.tsx`
  - Revisar los botones de abrir onboarding shopper/traveler y de abrir forms para que dependan de un solo target interactivo claro.

3. Auditar y corregir hover mobile en flujos críticos
- `src/components/PackageRequestForm.tsx`
  - Reemplazar `hover:`/`group-hover:` por `sm:hover:`/`sm:group-hover:` en:
    - step indicator
    - cards de tipo de pedido
    - cualquier selector tipo card
- `src/components/TripForm.tsx`
  - Hacer el mismo cambio en:
    - step indicator
    - delivery method cards
    - ayudas/íconos con hover
    - otros bloques interactivos del wizard
- `src/components/onboarding/OnboardingBottomSheet.tsx`
  - Cambiar hover de close/skip/etc. a desktop-only.
  - Si hace falta, limitar el swipe handler para que no capture toques sobre CTA/buttons.
- `src/components/dashboard/ReferralAnnouncementModal.tsx`
  - Mismo ajuste para sus CTA y close button.

4. Limpiar el workaround global en `src/index.css`
- El override actual tipo `button:hover { background-color: inherit !important; }` no resuelve todo y además puede dejar estilos inconsistentes.
- Lo reemplazaría por una solución más precisa:
  - mantener solo utilidades de touch (`touch-action`, tap highlight)
  - confiar en `sm:hover:` en componentes interactivos, que es el patrón correcto para móvil.

5. Verificación funcional
- Probar en viewport móvil, mínimo:
  - botón de onboarding shopper en `/dashboard?tab=packages`
  - Quick Actions: abrir package form y trip form al primer tap
  - botones `Siguiente`, `Continuar`, `Saltar`, `Cerrar` en onboardings
  - cards/selectores dentro de `PackageRequestForm` y `TripForm`
  - navegación entre steps y submit
- Objetivo de QA: ningún flujo debe requerir segundo toque para ejecutar la acción.

Detalles técnicos
- Archivos previstos:
  - `src/components/ui/button.tsx`
  - `src/components/dashboard/QuickActions.tsx`
  - `src/components/Dashboard.tsx`
  - `src/components/PackageRequestForm.tsx`
  - `src/components/TripForm.tsx`
  - `src/components/onboarding/OnboardingBottomSheet.tsx`
  - `src/components/dashboard/ReferralAnnouncementModal.tsx`
  - `src/index.css`
- No hace falta tocar base de datos.
- El warning de `React.Fragment` en `CollapsiblePackageCard` es otro tema distinto y no explica el doble tap.

Resultado esperado:
- En móvil, todos los CTA relevantes responden al primer toque, sin hover sticky y sin targets internos “muertos”.
