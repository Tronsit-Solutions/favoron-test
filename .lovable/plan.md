

## Fix: Allow multiple investments per channel per month

### Problem
The table `marketing_investments` has a `UNIQUE (channel, month)` constraint that prevents inserting more than one investment for the same channel and month. The previous fix changed `upsert` to `insert`, but the DB constraint still blocks duplicates.

### Solution

**1. Database migration** — Drop the unique constraint:
```sql
ALTER TABLE marketing_investments DROP CONSTRAINT marketing_investments_channel_month_key;
```

That's it. One migration, no frontend changes needed (the `.insert()` code from the previous fix is already correct).

