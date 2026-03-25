

## Fix: Add 'scheduled' to call_status check constraint

The error `customer_experience_calls_call_status_check` occurs because the DB check constraint only allows: `pending`, `contacted`, `no_answer`, `completed`. The new `scheduled` status is missing.

### Change

**Migration SQL** — Drop and recreate the check constraint to include `scheduled`:

```sql
ALTER TABLE public.customer_experience_calls 
  DROP CONSTRAINT customer_experience_calls_call_status_check;

ALTER TABLE public.customer_experience_calls 
  ADD CONSTRAINT customer_experience_calls_call_status_check 
  CHECK (call_status = ANY (ARRAY['pending', 'contacted', 'no_answer', 'completed', 'scheduled']));
```

Single migration, no code changes needed.

