

## Plan: Separar reportes de usuarios de errores automáticos

### Cambio en `src/components/admin/AdminSupportTab.tsx`

Split the "Errores del Cliente" tab into two sub-tabs using inner `Tabs`:

1. **"Reportes de Usuarios"** — filters `client_errors` where `type === 'user_report'`
   - Show with a `MessageSquare` icon and count badge
   - Same table structure but highlight the user's message more prominently
   - Show context info (section, screenshot status) from the `context` field

2. **"Errores del Sistema"** — filters `client_errors` where `type !== 'user_report'`
   - Show with `AlertTriangle` icon and count badge
   - Keep existing table layout (message, stack, route, severity, browser)

### Implementation details

- Add a new state: `errorsSubTab` defaulting to `'user_reports'`
- Split `filteredErrors` into two arrays: `userReports` and `systemErrors`
- Render inner `Tabs` component inside the `errors` TabsContent
- Both sub-tabs share the same search/filter controls and fetch logic
- Add count badges on each sub-tab showing `userReports.length` and `systemErrors.length`

