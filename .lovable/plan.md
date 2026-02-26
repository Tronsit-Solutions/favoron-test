

## Problem Analysis

The core issue: When a user (shopper or admin) makes a change (upload document, change status, etc.), the **optimistic update** in `updatePackage` (line 311 of `useOptimizedPackagesData.tsx`) works correctly. However, **milliseconds later**, the Supabase realtime subscription fires in `useOptimizedRealtime.tsx` and overwrites the local state with `payload.new` — which is **raw table data without joined relations** (`profiles`, `trips`). This causes the UI to break or show incomplete data until a hard refresh re-fetches everything with joins.

Additionally, the `useOptimizedRealtime` handler uses a stale `packages` closure reference, so incremental merges can lose data.

## Solution: Fix realtime handler to preserve joined data + skip self-mutations

### Changes in `src/hooks/useOptimizedRealtime.tsx`

1. **Skip own mutations**: Track a "last mutation timestamp" via a ref. When `updatePackage` fires, set a flag. When realtime fires within ~2 seconds for the same package ID from the same user, skip the realtime overwrite — the optimistic update already has better data.

2. **Preserve joined relations on merge**: When merging `payload.new` into an existing package, explicitly preserve `profiles` and `trips` keys from the existing object, since realtime payloads never include joined data.

Current problematic merge (line 124):
```typescript
updatedPackages[existingIndex] = { ...updatedPackages[existingIndex], ...payload.new };
```

Fixed merge:
```typescript
const existing = updatedPackages[existingIndex];
updatedPackages[existingIndex] = { 
  ...existing, 
  ...payload.new,
  // Preserve joined relations that realtime payloads don't include
  profiles: existing.profiles,
  trips: existing.trips
};
```

3. **Apply the same fix in `processUpdateQueue`** (line 80) which has the same merge pattern.

### Changes in `src/hooks/useOptimizedPackagesData.tsx`

4. **Export a mutation tracker ref** so `useOptimizedRealtime` can check if a package was just mutated locally. Add a `recentMutationsRef` that stores `{ [packageId]: timestamp }` and is set in `updatePackage`. This lets the realtime handler skip redundant updates for packages the user just modified.

### Files to modify
- `src/hooks/useOptimizedRealtime.tsx` — Preserve joined data on merge, skip own recent mutations
- `src/hooks/useOptimizedPackagesData.tsx` — Track recent local mutations via a ref, expose it

