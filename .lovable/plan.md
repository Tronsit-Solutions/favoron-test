

## Fix: Scrollbar overlapping card edges on mobile

### Problem
The previous fix added `scrollbar-gutter: stable` to `body` and `.mobile-container`, which reserves permanent scrollbar space and pushes content left, clipping card right edges.

### Changes

**1. `src/index.css` — Revert scrollbar-gutter, add overlay scrollbar**
- Remove `overflow-y: scroll` and `scrollbar-gutter: stable` from `body`
- Remove `scrollbar-gutter: stable` from `.mobile-container`
- Add a thin overlay scrollbar style for the main scrollable area:
  ```css
  body {
    overflow-y: auto;
  }
  /* Thin overlay scrollbar that doesn't consume layout space */
  body::-webkit-scrollbar { width: 4px; }
  body::-webkit-scrollbar-track { background: transparent; }
  body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }
  /* Firefox thin scrollbar */
  html { scrollbar-width: thin; scrollbar-color: rgba(0,0,0,0.15) transparent; }
  ```

**2. `src/components/Dashboard.tsx` — Revert pr-1 on packages TabsContent**
- Line 844: Remove the `pr-1` that was added, keeping the original classes

These two changes ensure the scrollbar renders as a thin transparent overlay without taking layout space, so cards get equal left/right margins.

