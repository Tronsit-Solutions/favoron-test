

## Restore "vinito" package to bid_pending state

Package ID: `e00005a7-bfd3-4ca2-9f90-b8f33861b785`

### Data operations needed (via Supabase insert tool)

**1. Reset the package** — Clear promoted winner data, keep status `matched`:
```sql
UPDATE packages SET
  matched_trip_id = NULL,
  quote = NULL,
  matched_trip_dates = NULL,
  traveler_address = NULL,
  quote_expires_at = NULL
WHERE id = 'e00005a7-bfd3-4ca2-9f90-b8f33861b785';
```

**2. Reset both assignments to `bid_pending`** — Clear quotes and traveler data:
```sql
UPDATE package_assignments SET
  status = 'bid_pending',
  quote = NULL,
  traveler_address = NULL,
  matched_trip_dates = NULL,
  quote_expires_at = NULL
WHERE package_id = 'e00005a7-bfd3-4ca2-9f90-b8f33861b785';
```

This restores the package to the state where admin has assigned 2 travelers but neither has submitted a bid yet.

