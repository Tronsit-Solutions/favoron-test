

## Plan: Make `package-chat-files` bucket private

### Problem
The bucket is set to `public = true`, which means anyone with a direct file URL can access chat files without authentication, bypassing all RLS policies.

### Why this is safe to fix
The codebase already handles private buckets correctly:
- **Upload flow** (`usePackageChat.tsx`): Creates signed URLs via `createSignedUrl()` after upload and stores them in `file_url`
- **Display flow** (`FileAttachment.tsx`): Uses `resolveSignedUrl()` which parses storage URLs and generates fresh signed URLs via the Supabase SDK
- **Download flow** (`usePackageChat.tsx`): `downloadFile()` creates signed URLs for storage paths, or opens full URLs directly

### Existing RLS policies (already correct)
- **SELECT**: Shopper, matched traveler, or admin can view files
- **INSERT**: Shopper, matched traveler, or admin can upload
- **UPDATE/DELETE**: Same scoping with admin access

### Changes required

**1. SQL Migration** -- Set bucket to private:
```sql
UPDATE storage.buckets 
SET public = false 
WHERE id = 'package-chat-files';
```

That's it. One line. No code changes needed since the frontend already uses signed URLs everywhere.

