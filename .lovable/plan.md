

## Fix: Date picker not clickable in package request form

The calendar dates can't be clicked because the Popover renders inside a Dialog, causing z-index/pointer-events conflicts.

### Changes needed in `src/components/PackageRequestForm.tsx` (lines 907-914):

1. Add `z-[60]` to `PopoverContent` so it renders above the Dialog overlay (z-50)
2. Add `pointer-events-auto` to `Calendar` className so clicks register properly

```tsx
<PopoverContent className="w-auto p-0 z-[60]" align="start">
  <Calendar
    mode="single"
    selected={formData.deliveryDeadline || undefined}
    onSelect={(date) => handleInputChange('deliveryDeadline', date)}
    disabled={(date) => date < new Date()}
    initialFocus
    className="pointer-events-auto"
  />
</PopoverContent>
```

Single file change, 2 lines modified.

