

## Plan: Add General CAC Analysis Section

The hook already computes `globalKPIs` with combined metrics (total investment, total revenue, global CAC, global LTV, LTV/CAC ratio) but the UI never displays them. We need to add a new "General" section at the top of the CAC tab.

### Changes

**1. `src/components/admin/cac/CACKPICards.tsx`** — Add new `GeneralKPICards` component

- Accept `GlobalKPIs` + `totalIncidentCosts` as props
- Display 8 cards: CAC General (total investment / total monetized), LTV, LTV/CAC, LTV Neto, Tasa Conversión, Usuarios Activos/Total, Monetizados, Inversión Total
- Use a green/neutral color scheme to differentiate from the blue (shoppers) and orange (travelers) sections

**2. `src/components/admin/cac/CACAnalysisTab.tsx`** — Add General section before Shoppers

- Import `GeneralKPICards` and render it with a header icon (e.g., `BarChart3`) titled "Unit Economics: General"
- Pass `globalKPIs` and `shopperKPIs.totalIncidentCosts` to the new component
- Also add a general CACTable with `mode="general"` showing per-channel combined data (total investment, total CAC = investment/monetized, LTV, LTV/CAC)

**3. `src/components/admin/cac/CACTable.tsx`** — Add `mode="general"` support

- When mode is "general", show columns: Canal, Registrados, Activos, Monetizados, Inversión Total, CAC (total inv / monetized), LTV, LTV/CAC
- This uses the existing `totalInvestment` field on `CACChannelData` (which is already the combined shopper+traveler investment)

