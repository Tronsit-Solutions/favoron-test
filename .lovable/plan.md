

## Plan: Fix PDF rendering in admin PurchaseConfirmationViewer

### Problem
The admin's `PurchaseConfirmationViewer` modal fails to display PDFs. The iframe renders but shows a broken document icon, suggesting the blob URL content is invalid or the download from storage is failing silently.

### Root Cause Analysis
Two likely issues in `src/components/admin/PurchaseConfirmationViewer.tsx`:

1. **Missing bucket fallback**: `DEFAULT_BUCKETS_ORDER` only includes `purchase-confirmations` and `payment-receipts`, but some files may be stored in `product-receipts`
2. **Blob URL approach is fragile**: The `loadPdfAsBlob` function downloads the file and creates a blob URL, but if the download silently fails (e.g., returns non-PDF data), the iframe gets invalid content with no user feedback

### Solution
Modify `src/components/admin/PurchaseConfirmationViewer.tsx`:

1. **Add `product-receipts` to `DEFAULT_BUCKETS_ORDER`** so all three storage buckets are tried
2. **Use signed URL directly for PDF iframe** instead of blob — the signed URL already works for downloads, and iframes can render PDFs directly from URLs. This eliminates the fragile blob approach
3. **Fallback**: If signed URL iframe fails, show the download button as fallback
4. **Remove `loadPdfAsBlob`** and `pdfBlobUrl` state — simplify by reusing the `signedUrl` that's already generated on mount

### Key change in the modal render
```tsx
{isPDF && (
  signedUrl ? (
    <iframe
      src={signedUrl}
      title="Comprobante de compra"
      className="w-full h-[70vh] rounded-lg border"
    />
  ) : loading ? (
    <div>Cargando PDF...</div>
  ) : (
    <div>No se pudo cargar el PDF — Descargar</div>
  )
)}
```

### File modified
- `src/components/admin/PurchaseConfirmationViewer.tsx`

