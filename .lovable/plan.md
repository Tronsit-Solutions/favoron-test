

## Plan: Fix slow matches — synchronous HTTP calls blocking the DB transaction

### Root cause

The slowness is **not** network latency to Supabase. The real bottleneck is inside the database itself.

When the RPC `assign_package_to_travelers` updates `packages.status = 'matched'`, it fires **22 triggers** on the `packages` table. Two of these triggers make **synchronous HTTP calls** that block the entire transaction until they complete:

1. **`notify_shopper_package_status`** → calls `create_notification_with_direct_email()` which uses **`extensions.http()`** (synchronous) to:
   - Call the Resend API to send an email
   - Call the WhatsApp edge function

2. **`notify_traveler_package_status`** → calls `create_notification()` which uses **`net.http_post()`** (this one is async/non-blocking, so it's fine)

The function `create_notification_with_direct_email` on lines 159-173 and 193-209 uses `extensions.http()` — this is a **synchronous** HTTP extension that waits for the external API to respond before returning. If Resend takes 1-3 seconds, and WhatsApp another 1-3 seconds, the entire RPC is blocked for 2-6 seconds just on notifications.

Additionally, `create_notification` (used by other triggers) uses `net.http_post()` which is the async pg_net version — that's fine and doesn't block.

### Solution

Replace `extensions.http()` with `net.http_post()` in `create_notification_with_direct_email`. The `net.http_post` function from the pg_net extension is asynchronous — it queues the HTTP request and returns immediately without waiting for the response.

### Technical detail — single SQL migration

Rewrite `create_notification_with_direct_email` to replace both HTTP calls:

**Email (Resend)**: Change from `extensions.http(('POST', 'https://api.resend.com/emails', ...))` to:
```sql
PERFORM net.http_post(
  url := 'https://api.resend.com/emails',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.resend_api_key', true)
  ),
  body := jsonb_build_object(
    'from', 'Favoron <noreply@favoron.app>',
    'to', ARRAY[user_email],
    'subject', 'Favoron - ' || _title,
    'html', email_body
  )::jsonb
);
```

**WhatsApp**: Change from `extensions.http(('POST', 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-whatsapp-notification', ...))` to:
```sql
PERFORM net.http_post(
  url := 'https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/send-whatsapp-notification',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
  ),
  body := jsonb_build_object(
    'user_id', _user_id::text,
    'title', _title,
    'message', _message,
    'type', _type,
    'priority', _priority,
    'action_url', _action_url
  )
);
```

The trade-off is that we lose the ability to log HTTP response status, but since errors are already caught silently this is acceptable. The notifications will still be sent — just without blocking the transaction.

### Expected result
- Match completes in ~100-200ms instead of 2-6 seconds
- Emails and WhatsApp messages still get sent, just asynchronously
- No client-side code changes needed

### Files to modify
1. **SQL migration only** — rewrite `create_notification_with_direct_email` function

