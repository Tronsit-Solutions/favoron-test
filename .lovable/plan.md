

## Plan: Layout Hub de Viajes y Referral Banner side by side

Currently in `src/components/Dashboard.tsx` (lines 600-603), `AvailableTripsCard` and `ReferralBanner` are stacked vertically. Wrap them in a responsive grid so they sit side by side on desktop.

### Change in `src/components/Dashboard.tsx` (lines 600-603)

Replace:
```tsx
<AvailableTripsCard onViewTrips={...} />
<ReferralBanner />
```

With:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <AvailableTripsCard onViewTrips={...} />
  <ReferralBanner />
</div>
```

This keeps them stacked on mobile (`grid-cols-1`) and side by side on medium+ screens (`md:grid-cols-2`).

