

## Plan: Allow multi-file selection in purchase confirmation upload

**File**: `src/components/PurchaseConfirmationUpload.tsx`

1. Add `multiple` attribute to the `<input type="file">` element
2. Update `handleFileSelect` to process `event.target.files` as a list (loop through all selected files)
3. Upload all selected files sequentially (or in parallel), then call `onUpload` with the merged array

This lets the shopper select multiple invoices at once from the file picker (e.g., invoice crema + invoice gin + invoice Vermouth) instead of uploading one by one.

