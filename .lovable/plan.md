

## Problem
The support panel on mobile is positioned with `right-10 top-1/2 -translate-y-1/2` and `w-[calc(100vw-48px)]`, which causes it to float awkwardly — partially overlapping content, not fully visible, and hard to interact with on small screens.

## Solution
On mobile (`max-sm`), make the panel full-screen or near-full-screen as a bottom sheet style, properly contained and scrollable.

### Changes in `src/components/SupportBubble.tsx`

1. **Panel positioning on mobile**: Change from centered floating panel to a bottom-anchored, full-width overlay on small screens:
   - Mobile: `fixed inset-x-0 bottom-0 w-full max-h-[85vh] rounded-t-2xl rounded-b-none`
   - Desktop: keep current `right-10 top-1/2 -translate-y-1/2 w-[320px] rounded-2xl`

2. **Add backdrop overlay on mobile** when panel is open (semi-transparent background) for better focus.

3. **Ensure inner content scrolls** within the constrained mobile height via `overflow-y-auto` on content areas.

