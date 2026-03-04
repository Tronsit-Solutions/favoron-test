

## Plan: Fix RLS policy for admin photo uploads

### Problem
The storage bucket `product-photos` has an INSERT policy that only allows users to upload files to their own folder (`auth.uid() = foldername(name)[1]`). When an admin uploads a photo for a different user's order, the folder is the **package owner's** user_id, not the admin's, so the RLS policy blocks it.

### Fix
Add a new storage RLS policy allowing admins to upload to the `product-photos` bucket:

```sql
CREATE POLICY "Admins can upload product photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'product-photos'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```

Also add an UPDATE policy for admins (needed for upserts):

```sql
CREATE POLICY "Admins can update product photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'product-photos'
  AND EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
```

### Scope
- Single SQL migration, no code changes needed
- The existing `handleAdminAddPhoto` function in `PackageDetailModal.tsx` will work as-is once the policy is added

