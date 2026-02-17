

## Fix: Add Authentication to `create-recurrente-checkout` Edge Function

### Problem
The edge function creates payment checkouts without verifying who is making the request. It trusts `user_id` from the request body and uses the service role key for all operations, bypassing RLS.

### Changes

**1. Edge Function: `supabase/functions/create-recurrente-checkout/index.ts`**

- Extract `Authorization` header from the request
- Use `getClaims(token)` to validate the JWT and get the authenticated user ID
- Return 401 if no valid auth token is present
- Use the authenticated `user.sub` as the real user ID (ignore `user_id` from body)
- Verify the package belongs to the authenticated user before proceeding
- Keep the service role client only for the package update after checkout creation

```text
// Flow:
1. Extract Authorization header -> 401 if missing
2. getClaims(token) to get authenticated user ID -> 401 if invalid
3. Verify package belongs to user (user-context client with RLS)
4. Create Recurrente checkout using authenticated user ID
5. Update package with service role client (bypasses RLS for the update)
```

**2. Frontend Hook: `src/hooks/useRecurrenteCheckout.tsx`**

- Remove `user_id` from the request body (no longer needed since the edge function derives it from the JWT)
- The `supabase.functions.invoke()` call already sends the auth token automatically via the Authorization header

**3. Config: `supabase/config.toml`**

- Keep `verify_jwt = false` (required for Lovable Cloud ES256 compatibility)
- Authentication is validated explicitly in code via `getClaims()`

### Technical Details

Edge function authentication pattern:
```text
const authHeader = req.headers.get('Authorization');
if (!authHeader) return 401;

const anonClient = createClient(url, anonKey, {
  global: { headers: { Authorization: authHeader } }
});

const token = authHeader.replace('Bearer ', '');
const { data, error } = await anonClient.auth.getClaims(token);
if (error || !data?.claims) return 401;

const userId = data.claims.sub;  // Trusted user ID from JWT
```

Package ownership check:
```text
const { data: pkg } = await anonClient
  .from('packages')
  .select('id, user_id')
  .eq('id', package_id)
  .single();

if (!pkg || pkg.user_id !== userId) return 403;
```

### Security Impact
- Prevents unauthenticated checkout creation
- Prevents user impersonation (can't create checkouts for other users' packages)
- Service role client is only used for the post-checkout package update
