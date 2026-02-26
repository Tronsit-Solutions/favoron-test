

## Plan: Add metric explanation modal on KPI card click

### Approach
Create a reusable `KPIExplanationModal` component that shows the formula, calculation breakdown with actual values, and a plain-language explanation when any KPI card is clicked.

### Changes

#### 1. New file: `src/components/admin/cac/KPIExplanationModal.tsx`
- Dialog with title, formula, calculation breakdown (showing actual numbers), and explanation text
- Props: `open`, `onClose`, `title`, `formula`, `calculation`, `explanation`, `value`

#### 2. Modify: `src/components/admin/cac/CACKPICards.tsx`
- Add `formula`, `calculation`, and `explanation` fields to each card definition in all 4 card components (ShopperKPICards, TravelerKPICards, GeneralKPICards, RecurrenceKPICards)
- Add `useState` for selected card, render `KPIExplanationModal`
- Make each Card clickable with `cursor-pointer` and `hover:shadow-md`

#### Metric explanations (examples):

**Shoppers:**
- **CAC**: `Inversión Shoppers / Monetizados` → `Q{investment} / {monetized} = Q{cac}` — "Cuánto cuesta adquirir un shopper que paga."
- **LTV**: `Revenue Total / Monetizados` → Shows actual values — "Ingreso promedio que genera cada shopper monetizado."
- **LTV/CAC**: `LTV / CAC` — "Si es ≥3, el negocio es saludable. Cada quetzal invertido retorna 3+."
- **ARPU**: `Revenue / Activos` — "Ingreso promedio por shopper activo (incluye los que no pagaron)."
- **CAC/Pedido**: `Inversión / Pedidos Pagados` — "Costo de adquisición por transacción individual."
- **LTV Neto**: `(Revenue - Incidencias) / Monetizados` — "LTV real después de restar pérdidas."

**Travelers:**
- **CAC Viajeros**: `Inversión Viajeros / Productivos` — "Costo de adquirir un viajero que entrega paquetes."
- **Pkgs/Viajero**: `Paquetes Entregados / Productivos` — "Eficiencia promedio por viajero."

**Recurrence:**
- **Shoppers Recurrentes**: `Shoppers con 2+ pedidos / Monetizados` — "Porcentaje de shoppers que repiten compra."
- **Pedidos Promedio**: `Total pedidos recurrentes / Shoppers recurrentes` — "Frecuencia de compra entre quienes repiten."

Each card will dynamically build its `calculation` string using the actual KPI values passed as props.

