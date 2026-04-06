

## Plan: Fix Payment Receipt Storage RLS Policies

### Problem

The `payment-receipts` storage bucket has **conflicting RLS policies** with two different path conventions:

- **Old policies** expect path: `{user_id}/{fileName}` (checking `auth.uid() = foldername[1]`)
- **Current code** uses path: `{package_id}/{fileName}` (matching the memory constraint)

The old policies silently fail for shoppers when they conflict with the correct package-ID-based policies, especially during re-uploads (upsert requires UPDATE permission).

### Policies to DROP (legacy, wrong path convention)

| Policy Name | Operation | Problem |
|---|---|---|
| `Users can upload their own payment receipts` | INSERT | Expects user_id as first folder |
| `Users can update their own payment receipts` | UPDATE | Expects user_id as first folder |
| `Users can delete their own payment receipts` | DELETE | Expects user_id as first folder |
| `Shoppers can upload purchase confirmations` | INSERT | Too permissive, no path validation |
| `Shoppers and admins can update purchase confirmations` | UPDATE | Checks `purchase_confirmation` field instead of `payment_receipt` |
| `Restricted access to purchase confirmations` | SELECT | Checks `purchase_confirmation->>'filePath'` for payment-receipts bucket (wrong field) |

### Policies that STAY (correct, package-ID-based)

These already exist and handle all operations correctly:

| Policy Name | Operation | Logic |
|---|---|---|
| `Users can upload package documents` | INSERT | Validates pkg.id in path + user ownership |
| `Users can update package documents` | UPDATE | Same validation |
| `Users can delete package documents` | DELETE | Same validation |
| `Users can view their own package documents` | SELECT | Same validation |
| `Admins can insert/view/update/delete payment receipts` | ALL | Admin access |
| `Operations staff can view payment receipts` | SELECT | Operations access |
| `Travelers can view matched package payment receipts` | SELECT | Traveler access |

### Implementation

**Single SQL migration** that drops the 6 conflicting policies. No code changes needed — the frontend already uses the correct `${pkg.id}/${fileName}` path structure.

### Files
1. **Migration only** — drop 6 legacy storage policies

