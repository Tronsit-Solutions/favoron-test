

## Plan: Simplify Admin Header Buttons

### Changes to `src/components/dashboard/DashboardHeader.tsx`

1. **Operations button**: Remove `<span>Operaciones</span>`, keep only the Package icon
2. **WhatsApp button**: Remove `<span>WhatsApp</span>`, keep only the MessageCircle icon
3. **Add Control Admin button**: New icon-only button (Settings icon) that navigates to `/admin/control`, styled similarly to the other icon buttons

All three buttons will be icon-only with tooltips implied by their existing styling, matching the compact look shown in the screenshot.

