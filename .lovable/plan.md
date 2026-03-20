

## Fix: Add `boost_code` to admin trips RPC

### Problem
The `get_admin_trips_with_user` RPC function doesn't include `boost_code` in its SELECT statement, so admin trip data never has this field — the badge in AdminApprovalsTab can never show.

### Solution
Update the RPC to include `t.boost_code` in the SELECT list.

### Changes

**1. New Supabase migration** — `CREATE OR REPLACE FUNCTION get_admin_trips_with_user()`:
- Add `t.boost_code` to the SELECT columns
- Add `t.boost_code` to the return type (or use `text` type)

The full updated function will mirror the existing one but add `t.boost_code` after `t.available_space`.

