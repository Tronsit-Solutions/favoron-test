

## Performance Optimization Plan

### Problem
Lighthouse desktop score is 64. The main bundle (`index-BTQsb2m8.js`) is **1.1 MB** with **82% unused JS** on the landing page. This causes:
- Total Blocking Time: 540ms
- Speed Index: 2.4s  
- JS execution time: 1.5s

The root cause: `Dashboard.tsx` (1231 lines) statically imports heavy components like `AdminDashboard`, `GodModeDashboard`, `UserManagement`, `PackageRequestForm`, `TripForm`, `QuoteDialog`, and many others. Since `Dashboard` is lazy-loaded from `App.tsx`, BUT these static imports inside it prevent Vite from properly tree-shaking — the entire admin + dashboard graph gets pulled into the main chunk.

Additionally, `TravelsHubSection` on the landing page eagerly imports `AvailableTripsCard` and `AvailableTripsModal` (with Supabase queries), which aren't needed above the fold.

### Changes

**1. Lazy-load heavy sub-components inside `Dashboard.tsx`**

Convert static imports to `lazy()` for components only rendered conditionally:

```typescript
// Before
import AdminDashboard from "./AdminDashboard";
import GodModeDashboard from "./admin/GodModeDashboard";
import UserManagement from "./admin/UserManagement";
import PackageRequestForm from "./PackageRequestForm";
import TripForm from "./TripForm";
import QuoteDialog from "./QuoteDialog";
import EditProfileModal from "./profile/EditProfileModal";
import PrimeModal from "./PrimeModal";
import AcquisitionSurveyModal from "./AcquisitionSurveyModal";

// After
const AdminDashboard = lazy(() => import("./AdminDashboard"));
const GodModeDashboard = lazy(() => import("./admin/GodModeDashboard"));
const UserManagement = lazy(() => import("./admin/UserManagement"));
const PackageRequestForm = lazy(() => import("./PackageRequestForm"));
const TripForm = lazy(() => import("./TripForm"));
const QuoteDialog = lazy(() => import("./QuoteDialog"));
const EditProfileModal = lazy(() => import("./profile/EditProfileModal"));
const PrimeModal = lazy(() => import("./PrimeModal"));
const AcquisitionSurveyModal = lazy(() => import("./AcquisitionSurveyModal"));
```

Wrap each usage in `<Suspense>` with a spinner fallback.

**2. Lazy-load `TravelsHubSection` on landing page (`Index.tsx`)**

Move it from eager import to lazy like the other below-fold sections.

**3. Add `width` and `height` to logo image (`NavBar.tsx`)**

Add explicit dimensions to the logo `<img>` tag to prevent layout shifts (CLS) and fix the Lighthouse "unsized images" warning.

**4. Preconnect to Supabase (`index.html`)**

Add `<link rel="preconnect">` for `dfhoduirmqbarjnspbdh.supabase.co` to reduce connection setup time for API calls.

**5. Defer Google Fonts loading (`index.html`)**

Change the font stylesheet `<link>` to use `media="print" onload="this.media='all'"` pattern to make it non-render-blocking.

### Files Modified
| File | Change |
|---|---|
| `src/components/Dashboard.tsx` | Lazy-load 9 heavy sub-components |
| `src/pages/Index.tsx` | Lazy-load `TravelsHubSection` |
| `src/components/NavBar.tsx` | Add `width`/`height` to logo img |
| `index.html` | Preconnect to Supabase, defer font loading |

### Expected Impact
- Main bundle size reduction: ~40-60% (admin, forms, modals split into separate chunks)
- Unused JS on landing: significant reduction
- TBT improvement: less JS to parse on initial load
- Speed Index improvement from deferred fonts and preconnect

