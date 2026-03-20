

## Fix: Traveler Info Modal Not Opening in Match Dialog

### Problem
The traveler info modal (`Dialog` at line 1627) is nested **inside** the outer match `Dialog` (line 690-1907). Radix UI nested Dialogs conflict — the inner dialog's content gets blocked by the outer dialog's overlay/portal ordering.

### Solution
Move the traveler info Dialog **outside** the outer Dialog, making them siblings instead of nested. The state (`showTravelerInfo`, `selectedTraveler`) already lives in the component scope, so the inner Dialog just needs to be relocated.

### Changes — `src/components/admin/AdminMatchDialog.tsx`

1. **Close the outer `</Dialog>` before the traveler info Dialog** — move the traveler info Dialog (lines ~1627-1893), the `ProductTipAssignmentModal`, and `ImageViewerModal` outside the outer `<Dialog>` wrapper.

2. Wrap the return in a `<>` fragment:
   - `<Dialog open={showMatchDialog} ...>` ... `</Dialog>` (outer match dialog only)
   - `<Dialog open={showTravelerInfo} ...>` ... `</Dialog>` (traveler info — sibling)
   - `<ProductTipAssignmentModal .../>` (sibling)
   - `<ImageViewerModal .../>` (sibling)

No logic changes needed — just restructuring the JSX nesting.

