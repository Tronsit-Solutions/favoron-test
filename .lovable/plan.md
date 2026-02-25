

## Problem

The WhatsApp share button uses `https://wa.me/?text=...` which redirects to `api.whatsapp.com/send/` — this page gets blocked on desktop browsers (`ERR_BLOCKED_BY_RESPONSE`). Additionally, the 🎁 emoji in the message is corrupting the URL encoding (visible as `�` in the screenshot).

## Root Cause

Two files construct the WhatsApp share URL the same way:
- `src/components/dashboard/ReferralBanner.tsx` (line 42)
- `src/components/profile/ReferralSection.tsx` (line 48)

Both use:
```js
window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
```

Issues:
1. `wa.me` without a phone number redirects to `api.whatsapp.com` which blocks the response on desktop
2. The emoji 🎁 in `shareMessage` causes encoding corruption

## Fix

1. **Switch to `https://web.whatsapp.com/send?text=...`** — works reliably on desktop browsers
2. **Remove the emoji** from the share message to avoid encoding issues, or replace with a text alternative

Changes in both `ReferralBanner.tsx` (line 42) and `ReferralSection.tsx` (line 48):
```js
const handleWhatsAppShare = () => {
  const text = encodeURIComponent(shareMessage);
  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const url = isMobile
    ? `https://api.whatsapp.com/send?text=${text}`
    : `https://web.whatsapp.com/send?text=${text}`;
  window.open(url, '_blank');
};
```

Also remove or replace the 🎁 emoji in `shareMessage` to avoid URL corruption — change to a simple text like "→" or remove it entirely.

