

## Fix: Chat button and menu positioning in mobile cards

### Problem
In the uploaded screenshot for "En Tránsito" status, the chat button and three-dot menu aren't well positioned. The chat button should be vertically centered, and the three dots should be in the top-right corner consistently.

### Root Cause
The right column containing the chat button uses `ml-2 mr-6` which creates inconsistent spacing. The `mr-6` is meant to avoid overlap with the absolute-positioned three-dot menu, but the overall alignment isn't clean. The chat button column needs to account for the menu properly.

### Changes in `src/components/dashboard/CollapsiblePackageCard.tsx`

**1. Move three-dot menu INTO the right column instead of absolute positioning (mobile only):**
Instead of having the menu as `absolute top-2 right-2` and the chat in a separate column with `mr-6`, create a single right column that stacks:
- Three dots at the top
- Chat button centered in remaining space

```tsx
{/* Right column: menu + chat */}
<div className="flex flex-col items-center justify-between flex-shrink-0 ml-2 py-0">
  {/* Three dots at top */}
  <DropdownMenu>...</DropdownMenu>
  {/* Chat centered */}
  {isChatAvailable && (
    <Button chat ... />
  )}
  {/* Spacer if chat shown, to balance vertical centering */}
  {isChatAvailable && <div className="h-7" />}
</div>
```

This removes the absolute positioning for the menu on mobile and places both controls in the right column, ensuring consistent alignment regardless of status.

**2. Remove the absolute-positioned menu for mobile only:**
The current menu at lines 364-396 uses `absolute top-2 right-2`. For mobile, this should be moved into the right column. For desktop, keep it as-is.

**3. Remove `pr-10` from content column:**
Since the menu is no longer absolute, the content doesn't need extra right padding.

