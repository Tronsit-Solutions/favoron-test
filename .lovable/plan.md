

## Plan: Multiple Purchase Confirmation Uploads

### Problem
Currently `purchase_confirmation` stores a single document object. Shoppers with multiple purchases need to upload several confirmations.

### Data Format Change
Change `purchase_confirmation` from a single object to an array of objects, with backward compatibility:

```text
Before: { filename, filePath, uploadedAt, ... }
After:  [{ filename, filePath, uploadedAt, ... }, { ... }]
```

A helper function `normalizeConfirmations(data)` will handle both formats -- if it receives a single object, it wraps it in an array.

### Files to Modify

1. **`src/components/PurchaseConfirmationUpload.tsx`**
   - After confirming a file, reset to `ready` state so the user can upload more
   - Show a list of already-uploaded files above the upload area
   - Track uploaded files as a local array; on each confirm, call `onUpload` with the full array
   - Change `onUpload` callback to receive the array of all confirmations

2. **`src/hooks/useDashboardActions.tsx`** (~line 877-878)
   - When `type === 'confirmation'`, merge new uploads with existing ones instead of replacing:
     ```ts
     const existing = normalizeConfirmations(pkg.purchase_confirmation);
     updatedData.purchase_confirmation = [...existing, ...newFiles];
     ```

3. **`src/components/dashboard/UploadedDocumentsRegistry.tsx`**
   - Parse `purchase_confirmation` as `DocumentData[]` (using normalize helper)
   - Render each file as a separate row with view/edit buttons
   - Update document count accordingly

4. **`src/components/dashboard/EditDocumentModal.tsx`**
   - For purchase confirmation: upload adds to the array rather than replacing
   - Add ability to delete individual files from the array

5. **`src/components/admin/PackageDetailModal.tsx`** (~line 476-518)
   - `handleDeletePurchaseConfirmation`: delete all files from storage (loop through array)

6. **`src/components/dashboard/ShippingInfoModal.tsx`**
   - Show confirmation section as long as status allows (remove the `!pkg.purchase_confirmation` gate so users can always add more)

7. **`src/components/UploadDocuments.tsx`**
   - Same: keep showing confirmation upload section even if some files exist, so user can add more

### Helper Utility (new)
Create `src/utils/confirmationHelpers.ts`:
```ts
export const normalizeConfirmations = (data: any): DocumentData[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return [data]; // single legacy object
};
```

### Backward Compatibility
- All reads use `normalizeConfirmations()` so existing single-object data works seamlessly
- No DB migration needed (JSONB field accepts both formats)

