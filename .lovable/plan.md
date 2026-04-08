

## Add Shopper Onboarding Button next to "Mis Favorones"

### What
Add a HelpCircle button to the right of the "Mis Favorones" heading (packages tab), identical to how the traveler onboarding button sits next to "Mis Viajes". Clicking it opens the shopper OnboardingBottomSheet with the existing shopper slides.

### Changes

**`src/components/Dashboard.tsx`**

1. Add a `showShopperOnboarding` state variable (like `showTravelerOnboarding`)
2. Define `shopperOnboardingSlides` array at the top level (same slides currently in PackageRequestForm: Search, DollarSign, ShoppingCart, Package icons)
3. Wrap the "Mis Favorones" `<h3>` in a `flex items-center gap-2` div and add a HelpCircle button that sets `showShopperOnboarding(true)` — same pattern as line 945-949
4. Add a second `<OnboardingBottomSheet>` instance for shoppers below the existing traveler one, with `variant="shopper"` and the primary gradient

### Imports needed
- `Search, ShoppingCart` from lucide-react (already have Package, DollarSign, HelpCircle)

