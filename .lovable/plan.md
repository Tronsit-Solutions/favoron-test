

## Handle Supabase Auth Callback via Capacitor Deep Links

### What this does
On native Capacitor apps, OAuth redirects (Google sign-in) open the system browser. When the auth completes, Supabase redirects to a deep link (`favoron://auth/callback`). We need to intercept that deep link using the Capacitor App plugin and exchange the auth code for a session inside the app.

For email/password sign-in, no deep link handling is needed (it works inline). The main change is for OAuth flows.

### Changes

**1. Install `@capacitor/app`**
Required for listening to `appUrlOpen` events (deep link interception).

**2. Create `src/lib/capacitorAuth.ts`** -- Deep link handler utility
- Import `App` from `@capacitor/app` and `Capacitor` from `@capacitor/core`
- Export a `setupDeepLinkHandler(supabase, navigate)` function that:
  - Only runs on native (`Capacitor.isNativePlatform()`)
  - Listens for `appUrlOpen` events
  - Parses the URL for auth callback parameters (code, access_token, refresh_token)
  - If a `code` param is found, calls `supabase.auth.exchangeCodeForSession(code)`
  - If tokens are found directly, calls `supabase.auth.setSession()`
  - On success, navigates to `/dashboard`
- Returns a cleanup function to remove the listener

**3. Update `src/hooks/useAuth.tsx`**
- Import and call `setupDeepLinkHandler` inside the existing `useEffect` that sets up the auth listener
- Pass `supabase` and `navigate` to it
- Clean up on unmount

**4. Update `handleGoogleSignIn` in `src/pages/Auth.tsx` and `src/components/AuthModal.tsx`**
- When on native platform, change the `redirectTo` to `favoron://auth/callback` instead of `APP_URL/dashboard`
- Use `skipBrowserRedirect: false` (default) so Supabase opens the browser for OAuth

**5. Create `capacitor.config.ts`**
- Configure the app with the correct `appId`, `appName`, and `webDir`
- Add the server URL for dev hot-reload
- Note: The user will need to configure the `favoron://` URL scheme in their native project's `Info.plist` (iOS) and `AndroidManifest.xml` (Android)

### Post-implementation notes for the user
- Add `favoron` as a URL scheme in iOS `Info.plist` and Android `AndroidManifest.xml`
- Add `favoron://auth/callback` as an allowed redirect URL in Supabase Dashboard > Auth > URL Configuration
- Run `npx cap sync` after pulling changes

