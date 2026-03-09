

## Fix: Filter out unknown widget IDs on load

The `localStorage` key `god_mode_widgets_{userId}` contains widget IDs that no longer exist in `WIDGET_CATALOG` (likely from earlier iterations when widgets had different IDs). The `renderWidget` switch hits `default` and shows "Widget desconocido".

### Change in `src/components/admin/GodModeDashboard.tsx`

In the `useState` initializer for `activeWidgets` (~line 68), after reading from localStorage, filter the array to only include IDs that exist in `WIDGET_CATALOG`:

```ts
const validIds = new Set(WIDGET_CATALOG.map(w => w.id));
return parsedArray.filter(id => validIds.has(id));
```

This ensures stale/unknown widget IDs are silently dropped on load. No other changes needed.

