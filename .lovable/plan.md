

## Plan: Add Prime navigation card to profile

**File: `src/components/UserProfile.tsx`**

1. Import `Sparkles` from `lucide-react` and `PrimeModal` from `@/components/PrimeModal`
2. Add state `showPrimeModal` (boolean, default false)
3. Add a `ProfileNavigationCard` in the navigation grid (after Regulación Aduanera) with:
   - icon: `Sparkles`
   - title: "Favorón Prime"
   - description: "Beneficios exclusivos"
   - onClick: opens PrimeModal
4. Render `<PrimeModal>` at the bottom, controlled by `showPrimeModal` state, passing the current user

