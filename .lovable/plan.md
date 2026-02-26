

## Plan: Add Terms & Conditions and Customs Regulation cards to profile

### Changes

**File: `src/components/UserProfile.tsx`**
1. Import `FileText` and `Shield` icons from lucide-react
2. Import `TermsAndConditionsModal` and add state for it
3. Add `"customs"` to `ActiveSection` type
4. Add two new `ProfileNavigationCard` items to the grid:
   - **Términos y Condiciones** (FileText icon) — opens `TermsAndConditionsModal` on click
   - **Regulación Aduanera** (Shield icon) — navigates to customs section view
5. Add customs section full-page view with back button, embedding content from `CustomsRegulation` page (or linking to `/customs-regulation`)

**Customs section view**: Show a card with the key customs regulation info (similar to the existing `/customs-regulation` page content) with a back button.

