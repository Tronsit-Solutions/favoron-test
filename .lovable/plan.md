

## Plan: Reorganize Personal Info and Banking Info

### Changes

**1. `src/components/UserProfile.tsx`**
- Add `"personal"` and `"banking"` to `ActiveSection` type
- Make the ProfileHeader card clickable → sets `activeSection` to `"personal"`
- Replace the collapsible "Información Personal" card with showing PersonalInfoDisplay as a full-page section (like history, referrals, etc.) with back button
- Replace the collapsible "Información Bancaria" card with a `ProfileNavigationCard` in the grid (add `Landmark` icon, "Bancaria" title, "Pagos y cobros" description)
- Add full-page banking section view (like the others) with back button + BankingInfoDisplay/BankingInfoForm
- Grid becomes 2x3 (or 3 rows of 2): Historial, Referidos, Ayuda, Notificaciones, Bancaria
- Remove `personalOpen`, `bankingOpen` state variables (no longer collapsible)

**2. `src/components/profile/ProfileHeader.tsx`**
- Accept optional `onCardClick` prop
- Make the Card itself clickable (wrap with onClick or add cursor-pointer + click handler)
- Keep "Editar Perfil" button with stopPropagation so it still opens the edit modal

### Result
- Clicking the profile header card → navigates to personal info full-page view
- Banking info appears as a navigation card in the grid alongside the others
- Both sections use the same back-button pattern as history, referrals, etc.

