

## Fix: Move `pg_net` Extension from `public` to `extensions` Schema

### Finding
The `pg_net` extension is installed in the `public` schema. Supabase recommends installing extensions in the `extensions` schema to avoid polluting the public namespace and reduce attack surface.

### Migration

```sql
-- Move pg_net from public to extensions schema
ALTER EXTENSION pg_net SET SCHEMA extensions;
```

### Risk
- **Low risk**: `pg_net` is used internally by Supabase for webhooks/cron. Moving it to `extensions` is the recommended pattern and Supabase already includes `extensions` in the default search path, so existing functionality will continue working.
- No application code changes needed — this extension is not referenced directly in client code.

