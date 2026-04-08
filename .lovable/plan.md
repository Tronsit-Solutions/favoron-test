

## Fix: Add right padding to the package cards grid container

### Problem
The cards fill the full width of the container. The `mobile-container` class applies `px-4` (16px left and right) to the outer wrapper, but the cards grid at line 879 stretches edge-to-edge within that padded area. The right border of each card touches the container boundary and appears invisible because there's no visual breathing room — the card shadow/border blends with the edge.

Looking at the screenshot more carefully: the cards' right border IS at the edge of the padded area, but the "Soporte" floating tab partially covers it. The left side has visible card borders because nothing overlaps there.

### Solution
The simplest fix per the user's request: add `pr-4` to the `TabsContent` for packages (line 844), so the card list area gets an extra 16px right padding on mobile. This matches the left padding already provided by `mobile-container` and creates a visible gap on the right.

### Change

**`src/components/Dashboard.tsx` (line 844)**
- From: `className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-visible"`
- To: `className="space-y-4 sm:space-y-6 min-w-0 w-full max-w-full overflow-visible pr-4 sm:pr-0"`

This adds 16px right padding on mobile only, keeping desktop layout unchanged.

