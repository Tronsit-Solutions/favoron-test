

## Add Traveler Onboarding Button Next to "Nuevo Viaje"

### What
Add a small icon button (e.g., `HelpCircle` or `Info`) next to the "Nuevo Viaje" button in the Mis Viajes tab header that opens the traveler onboarding bottom sheet.

### Changes in `src/components/Dashboard.tsx`

1. **Add state and imports**: Import `OnboardingBottomSheet`, `OnboardingSlide`, and the icons used by the traveler onboarding slides (`Plane, Users, DollarSign, Package, Truck`). Add `showTravelerOnboarding` state.

2. **Define the slides array**: Copy the `travelerOnboardingSlides` definition (already in TripForm.tsx) into Dashboard or extract to a shared constant.

3. **Add button** (line ~940, inside the flex container next to "Nuevo Viaje"):
```tsx
<Button variant="outline" size="icon" className="h-10 w-10" onClick={() => setShowTravelerOnboarding(true)}>
  <HelpCircle className="h-4 w-4" />
</Button>
```

4. **Render `OnboardingBottomSheet`** at the bottom of the trips `TabsContent` with the slides, using `variant="traveler"` and the teal gradient.

5. **Handle continue/close**: Simple handlers that just close the sheet (no "don't show again" persistence needed since this is manual).

### Files
- `src/components/Dashboard.tsx` — add button, state, onboarding component

