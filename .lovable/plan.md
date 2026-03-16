

## Security Finding Analysis: `traveler_surveys` Public Access

**Issue**: The policy "Public can view consented traveler surveys" uses `roles: {public}` with `USING (consent_to_publish = true)`. The `{public}` role includes `anon`, meaning unauthenticated users can query `traveler_id` (UUID) and `trip_id` from all consented surveys — exposing internal identifiers.

**Current policies on `traveler_surveys`:**
1. "Admins can view all traveler surveys" — SELECT, `{public}`, `has_role(...)` ✓
2. **"Public can view consented traveler surveys"** — SELECT, `{public}`, `consent_to_publish = true` ← **vulnerable**
3. "Travelers can submit own survey" — INSERT, `auth.uid() = traveler_id` ✓
4. "Travelers can view own surveys" — SELECT, `auth.uid() = traveler_id` ✓

**Fix**: Drop the existing policy and recreate it restricted to `{authenticated}` role. This matches the same fix previously applied to `platform_reviews`.

### Migration

```sql
DROP POLICY IF EXISTS "Public can view consented traveler surveys" ON public.traveler_surveys;

CREATE POLICY "Authenticated can view consented traveler surveys"
ON public.traveler_surveys
FOR SELECT
TO authenticated
USING (consent_to_publish = true);
```

One migration, no code changes needed — the app only reads these surveys from authenticated contexts.

