

## Move "Emparejado" badge inline with package ID on mobile

### Problem
On mobile, the package ID and the status badge ("Emparejado" + "Ver detalle") are on separate lines, taking up too much vertical space.

### Solution

**File: `src/components/dashboard/CollapsiblePackageCard.tsx`**

Merge the ID line (lines 440-444) and the status badge row (lines 445-463) into a single flex row:

```
<div className="pl-5 flex items-center gap-2 flex-wrap">
  <span className="text-xs text-muted-foreground">ID: {pkg.id.substring(0, 8)}</span>
  {isCompeting && (
    <Badge variant="warning" className="text-xs">⚡ Compitiendo ({multiAssignments!.length})</Badge>
  )}
  <Button variant="outline" size="sm" ...>
    {getStatusBadge(...)}
    <span>Ver detalle</span>
  </Button>
</div>
```

This removes the separate `CardDescription` block for the ID and places it as a `<span>` inside the existing flex row with the badge. One section change, same file.

