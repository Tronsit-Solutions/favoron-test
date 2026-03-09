

## Analysis: RLS Policies with `WITH CHECK (true)` on INSERT

### Affected Tables

Four tables have overly permissive INSERT policies (`WITH CHECK (true)`) that allow **any authenticated user** to insert arbitrary rows:

| Table | Policy Name | Risk | Who Actually Inserts |
|-------|------------|------|---------------------|
| `notifications` | "System can insert notifications for users" | **High** — any user can create fake notifications for other users | `create_notification` RPC (SECURITY DEFINER), edge functions |
| `admin_profile_access_log` | "System can insert audit logs" | **Medium** — any user can insert fake audit entries, polluting the audit trail | `log_admin_profile_access` RPC (SECURITY DEFINER) |
| `trip_payment_accumulator` | "System can insert trip payment accumulator" | **High** — any user can insert payment accumulator records for any trip | Client code in `useCreateTripPaymentAccumulator.tsx` (authenticated users) |
| `whatsapp_notification_logs` | "System can insert whatsapp logs" | **Low** — log pollution only; inserts come from edge functions using service role which bypasses RLS anyway |

### Proposed Fix

Replace each `WITH CHECK (true)` with a scoped condition:

**1. `notifications`** — The `create_notification` RPC uses SECURITY DEFINER (bypasses RLS). No client code inserts directly. Change policy to admin-only or drop it entirely (SECURITY DEFINER functions bypass RLS):
```sql
DROP POLICY "System can insert notifications for users" ON notifications;
-- create_notification() already has SECURITY DEFINER, so it bypasses RLS
-- If needed, keep admin insert:
CREATE POLICY "Admins can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

**2. `admin_profile_access_log`** — Same pattern: `log_admin_profile_access` is SECURITY DEFINER. Drop the open policy:
```sql
DROP POLICY "System can insert audit logs" ON admin_profile_access_log;
-- The SECURITY DEFINER function bypasses RLS. Add admin-only fallback:
CREATE POLICY "Only admins can insert audit logs" ON admin_profile_access_log
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

**3. `trip_payment_accumulator`** — Client code inserts for trips the user is a traveler on. Restrict to trip owner or admin:
```sql
DROP POLICY "System can insert trip payment accumulator" ON trip_payment_accumulator;
CREATE POLICY "Travelers and admins can insert trip payment accumulator" ON trip_payment_accumulator
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR (traveler_id = auth.uid() AND trip_id IN (
      SELECT id FROM trips WHERE user_id = auth.uid()
    ))
  );
```

**4. `whatsapp_notification_logs`** — Edge functions use service role (bypasses RLS). Drop the open policy, add admin-only:
```sql
DROP POLICY "System can insert whatsapp logs" ON whatsapp_notification_logs;
CREATE POLICY "Only admins can insert whatsapp logs" ON whatsapp_notification_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Impact
- No functional change: all current insert paths use either SECURITY DEFINER functions or service role (both bypass RLS)
- Exception: `trip_payment_accumulator` — client-side inserts will now be properly scoped to the trip's traveler
- Security finding `SUPA_rls_policy_always_true` will be resolved

