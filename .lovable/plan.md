

## Plan: Change approval notification icon

**`src/components/ui/notification-dropdown.tsx`**

- Line 29: Change the `approval` icon from `AlertCircle` (warning/danger look) to `CheckCircle` with a green color for approved notifications, since approvals are positive events
- Specifically: replace `<AlertCircle className="h-4 w-4 text-orange-500" />` with `<CheckCircle className="h-4 w-4 text-green-500" />`

