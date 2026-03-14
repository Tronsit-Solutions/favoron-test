

## Skip landing page on native Capacitor app

### What we'll do
When the app runs as a native mobile app via Capacitor, bypass the landing page (`/`) and redirect to `/auth` (or `/dashboard` if already authenticated).

### Steps

1. **Install `@capacitor/core`** — needed for `Capacitor.isNativePlatform()` detection. No other Capacitor packages needed for this feature alone.

2. **Modify `src/pages/Index.tsx`**:
   - Import `Capacitor` from `@capacitor/core`
   - Add an early `useEffect` that checks `Capacitor.isNativePlatform()`
   - If native + authenticated → `navigate('/dashboard', { replace: true })`
   - If native + not authenticated (and not loading) → `navigate('/auth', { replace: true })`
   - If web → render landing page as normal

```tsx
useEffect(() => {
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
    if (!loading) {
      if (user && profile) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/auth', { replace: true });
      }
    }
  }
}, [user, profile, loading, navigate]);
```

3. Return `null` (or a spinner) while redirecting on native to avoid flash of landing page content.

This is a minimal, self-contained change — only `Index.tsx` needs modification plus the `@capacitor/core` dependency.

