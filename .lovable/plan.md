

## Fix: Referral code lost when navigating from landing page to auth

### Problem
When a user opens `favoron.app/?ref=DRUPHC`, the `ref` query param is on the landing page URL. When they click "Registrarse", `openAuth()` in `Index.tsx` navigates to `/auth` **without** carrying the `ref` param. The Auth page then reads `window.location.search` but finds no `ref` — so the referral is never saved to localStorage.

This also explains why Natalia's referral to Emma wasn't recorded: Emma likely landed on `/?ref=DRUPHC`, clicked Register, and the code was lost.

### Fix (two places)

**1. `src/pages/Index.tsx`** — Capture `ref` from URL on landing page and save to localStorage immediately (before any navigation happens):
```typescript
useEffect(() => {
  const searchParams = new URLSearchParams(window.location.search);
  const refCode = searchParams.get('ref');
  if (refCode) {
    localStorage.setItem('pending_referral_code', refCode);
    console.log('📎 Referral code captured on landing:', refCode);
  }
}, []);
```

**2. Also pass ref to `/auth` URL** — Update `openAuth` to forward the ref param:
```typescript
const openAuth = (mode: "login" | "register" = "login") => {
  const refCode = new URLSearchParams(window.location.search).get('ref');
  const authUrl = refCode ? `/auth?ref=${refCode}` : '/auth';
  navigate(authUrl, { state: { mode } });
};
```

This ensures the ref code is both persisted in localStorage immediately on landing AND forwarded to the auth page URL as a fallback. The existing Auth.tsx code will pick it up from either source.

### For the Natalia/Emma case
Once this fix is deployed, future referrals will work. For the existing missed referral, an admin manual insert is still needed (as discussed in the previous plan).

