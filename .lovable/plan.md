

## Plan: Reorganize User Profile (Uber-style layout)

Replace the current tab-based profile with a clean, section-based layout inspired by Uber's account screen. Remove the 3-tab structure and replace it with a compact profile header followed by navigation cards/sections.

### New Layout Structure

```text
┌─────────────────────────────────────┐
│  Avatar + Name + Level + Edit btn   │  (ProfileHeader - keep)
├─────────────────────────────────────┤
│  Saldo de referidos: Q30.00         │  (Balance card - like Uber balances)
├─────────────────────────────────────┤
│  ┌───────────┐  ┌───────────┐       │
│  │ 📦 Historial│  │ 🎁 Referidos│   │  Navigation cards (2x2 grid)
│  │ Pedidos y  │  │ Invita    │       │
│  │ Viajes     │  │ amigos    │       │
│  ├───────────┤  ├───────────┤       │
│  │ ❓ Ayuda   │  │ 🔔 Notif. │       │
│  │ Centro de │  │ Email y   │       │
│  │ soporte   │  │ WhatsApp  │       │
│  └───────────┘  └───────────┘       │
├─────────────────────────────────────┤
│  Información Personal (collapsible) │
│  Información Bancaria (collapsible) │
├─────────────────────────────────────┤
│  UserLevelCard + UserStats          │  (moved to bottom)
└─────────────────────────────────────┘
```

### Changes

**File: `src/components/UserProfile.tsx`** (major rewrite)
1. Remove the `Tabs` structure entirely
2. Keep `ProfileHeader` at top
3. Add a **Referral Balance card** right below the header showing `Q{balance}` prominently (like Uber's balance display)
4. Add a **2x2 navigation grid** with clickable cards:
   - **Historial de Pedidos y Viajes** - expands/navigates to show PackageHistory + TripHistory
   - **Referidos** - expands to show ReferralSection
   - **Ayuda** - opens the SupportBubble or links to help
   - **Notificaciones** - expands to show Email + WhatsApp notification settings
5. Below the grid, show **Información Personal** and **Información Bancaria** as collapsible sections
6. Move UserLevelCard and UserStats to the bottom as a compact "Mi Nivel" section
7. Remove the "Estado Actual" and "Actividad Reciente" cards from the main view (they're redundant with dashboard)

**File: `src/components/profile/ProfileNavigationCard.tsx`** (new file)
- Reusable card component for the 2x2 grid items
- Props: `icon`, `title`, `description`, `onClick`, optional `badge` (for notification count), optional `rightContent` (for balance display)
- Styled with rounded borders, subtle hover effect, like Uber's cards

**File: `src/components/profile/ProfileHistorySection.tsx`** (new file)
- Combined view that shows both PackageHistory and TripHistory in sub-tabs
- Rendered when user clicks "Historial de Pedidos y Viajes"

**File: `src/components/profile/ProfileNotificationsSection.tsx`** (new file)
- Contains both EmailNotificationSettings and WhatsAppNotificationSettings
- Rendered when user clicks "Notificaciones"

### Navigation Approach
- Use local state (`activeSection`) to toggle which section is expanded below the grid
- Clicking a card either expands its content inline (below the grid) or collapses it if already open
- Back arrow on expanded sections returns to the grid view

