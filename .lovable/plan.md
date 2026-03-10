

## Fix: Acquisition Survey blocked by RLS policy

### Problem
The `profile_update_allowed` security definer function treats `acquisition_source` as a protected field (like `is_banned`, `trust_level`, etc.). When a user tries to update their profile with a new `acquisition_source` value, the RLS `WITH CHECK` fails because the value changed from NULL.

### Solution
Create a dedicated RPC function (`submit_acquisition_survey`) with `SECURITY DEFINER` that bypasses the RLS restriction. This is cleaner than modifying the security function, since the survey is a one-time write.

### Changes

**1. New Supabase RPC (SQL migration)**
```sql
CREATE OR REPLACE FUNCTION public.submit_acquisition_survey(
  _source text,
  _referrer_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    acquisition_source = _source,
    acquisition_source_answered_at = now(),
    referrer_name = _referrer_name
  WHERE id = auth.uid()
    AND acquisition_source IS NULL; -- Only allow setting once
END;
$$;
```

**2. Modify `src/hooks/useAcquisitionSurvey.tsx`**
Replace the direct `.update()` call with an RPC call:
```tsx
const { error } = await supabase.rpc('submit_acquisition_survey', {
  _source: source,
  _referrer_name: referrerName || null
});
```

### Files modified
- New SQL migration (deploy via Supabase)
- `src/hooks/useAcquisitionSurvey.tsx` (switch to RPC call)

