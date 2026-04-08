

## Fix: Right edge of package cards clipped

### Root cause
Two parent containers are clipping the cards' right edge:

1. **Line 730** — the main content `div` has `overflow-x-hidden`, which clips any content reaching the right edge
2. **Line 751** — the `Tabs` wrapper has `overflow-hidden`, which also clips card borders and the "..." menu

The cards themselves render full-width, but these two `overflow-hidden` ancestors cut off the right border and shadow.

### Changes

**`src/components/Dashboard.tsx`**

1. **Line 730** — Remove `overflow-x-hidden` from the main content div:
   - Change: `w-full mobile-container py-2 sm:py-6 lg:py-8 max-w-full overflow-x-hidden box-border`
   - To: `w-full mobile-container py-2 sm:py-6 lg:py-8 max-w-full box-border`

2. **Line 751** — Remove `overflow-hidden` from the `Tabs` wrapper:
   - Change: `space-y-3 sm:space-y-6 min-w-0 w-full max-w-full overflow-hidden`
   - To: `space-y-3 sm:space-y-6 min-w-0 w-full max-w-full`

3. **Line 844** — Change `overflow-visible` back to default on the `TabsContent` (already set, keep as-is or simplify):
   - Keep: `space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-visible`

These changes remove the clipping ancestors so card right borders, shadows, and the "..." menu are fully visible. The `mobile-container` class (`px-4`) provides equal left/right padding, ensuring alignment with the "Nuevo Pedido" button and the top navbar tabs.

