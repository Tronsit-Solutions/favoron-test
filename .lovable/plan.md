

## Plan: Add confirmation emails for package requests and trip registrations

### Changes

**File: `src/hooks/useDashboardActions.tsx`**

1. **After successful package creation** (after line 88, inside the try block after `createPackage` succeeds):
   - Get the current user's ID from `supabase.auth.getUser()`
   - Call `supabase.functions.invoke('send-notification-email')` with:
     - `user_id`: current user's ID
     - `title`: "Tu solicitud de paquete fue enviada"
     - `message`: HTML summary including product descriptions, origin, destination, delivery deadline, delivery method
     - `type`: "package"
     - `priority`: "normal"
     - `action_url`: "https://favoron.app/dashboard"
   - Wrap in try/catch so email failure doesn't break the flow

2. **After successful trip creation** (after line 188, inside the try block after `createTrip` succeeds):
   - Get the current user's ID from `supabase.auth.getUser()`
   - Call `supabase.functions.invoke('send-notification-email')` with:
     - `user_id`: current user's ID
     - `title`: "Tu viaje fue registrado"
     - `message`: HTML summary including origin city/country, destination city/country, arrival date, package receiving window, delivery method, available space
     - `type`: "trip"
     - `priority`: "normal"
     - `action_url`: "https://favoron.app/dashboard"
   - Wrap in try/catch so email failure doesn't break the flow

### Notes
- Uses the existing `send-notification-email` edge function with `user_id` field (matching the pattern in `usePackageChat.tsx`)
- Email will only be sent if the user has email notifications enabled and the "package"/"trip" category enabled in their preferences
- No database or edge function changes needed

