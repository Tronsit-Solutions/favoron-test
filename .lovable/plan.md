

## Plan: Add delete photo functionality for personal order photos

### Change

**File: `src/components/admin/PackageDetailModal.tsx`**

1. **Add `handleAdminDeletePhoto` function** (near `handleAdminAddPhoto`):
   - Takes `productIndex` and `photoIndex` as parameters
   - Removes the photo from the `productPhotos` array in `products_data`
   - Deletes the file from Supabase storage using `parseStorageRef`
   - Calls `onUpdatePackage` to persist and `refetchPackageDetails` to refresh UI
   - Shows toast confirmation

2. **Add delete button overlay on each photo** (lines ~1835-1847):
   - Add a small `X` button positioned absolutely on top-right of each `ProductPhoto` wrapper
   - Only visible on hover for clean UX
   - Confirms deletion with the handler above

### Scope
- Single file change: `PackageDetailModal.tsx`
- No DB/migration changes needed (admin already has UPDATE on packages)

