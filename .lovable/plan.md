

## Plan: Replace mobile div-drawer with Dialog in both forms

### What changes

**Both `PackageRequestForm.tsx` and `TripForm.tsx`:**

1. Remove the `isMobile` conditional branch — use a single `Dialog` for both mobile and desktop.
2. Remove `useIsMobile` import and variable (if not used elsewhere in the file).
3. Remove `Sheet`/`SheetContent`/`SheetHeader`/`SheetTitle`/`SheetDescription` imports.
4. Replace the entire `if (isMobile) { ... }` block and the desktop `Dialog` block with a single unified `Dialog`:

```tsx
<Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
  <DialogContent className="h-[100dvh] max-h-[100dvh] w-full max-w-full m-0 p-0 flex flex-col rounded-t-2xl fixed bottom-0 translate-y-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom">
    <DialogHeader>...</DialogHeader>
    {formContent}
  </DialogContent>
</Dialog>
```

### Files modified
- `src/components/PackageRequestForm.tsx` — lines ~1596-1670 replaced; imports cleaned
- `src/components/TripForm.tsx` — lines ~1485-1537 replaced; imports cleaned

### What stays the same
- All form content, steps, validation, submission logic — untouched
- `isMobile` references elsewhere in the files (e.g., logging) will be checked; if no other usage, the hook import is removed

