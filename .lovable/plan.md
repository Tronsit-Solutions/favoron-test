

## Fix: RLS error when uploading payment receipt

### Problem
When a shopper tries to upload a payment receipt, they get "new row violates row-level security policy". The storage INSERT policy checks `auth.uid()::text = storage.foldername(name)[1]`, but the code uses `pkg.user_id` to build the file path. If `pkg.user_id` doesn't exactly match the authenticated user's `auth.uid()` (e.g., due to stale package data or a missing value), the RLS check fails.

### Root cause
The upload path is built as `${pkg.user_id}/${fileName}`, relying on the package's `user_id` prop. The RLS policy validates against `auth.uid()`. These should always match, but using a prop value instead of the actual authenticated user ID introduces a fragile dependency.

### Solution

**File: `src/components/dashboard/shopper/PaymentReceiptUpload.tsx`**

In `uploadFileToStorage`, fetch the current authenticated user from Supabase and use their ID to build the file path, instead of using `pkg.user_id`:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Debes iniciar sesión para subir archivos');
const filePath = `${user.id}/${fileName}`;
```

This guarantees the path always matches `auth.uid()` in the RLS policy, eliminating the mismatch.

Single file, 3-line change.

