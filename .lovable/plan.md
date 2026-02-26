

## Plan: Update card titles + Build Help section

### 1. Rename navigation card titles in `src/components/UserProfile.tsx`
- "Bancaria" → "Información Bancaria", description stays "Pagos y cobros"
- "Términos" → "Términos y Condiciones", description stays "Términos y condiciones"  
- "Aduanera" → "Regulación Aduanera", description stays "Regulación aduanera"

### 2. Create Help section view in `src/components/UserProfile.tsx`
When `activeSection === "help"`, render a full-page view with:

- **Back button** to return to profile
- **Report section**: A form (reusing same logic as SupportBubble's bug report) with description, section, and screenshot fields that submits to the `log-client-error` edge function
- **WhatsApp support card**: Display phone number 30616015 with a button linking to `https://wa.me/50230616015`
- **FAQ accordion**: Reuse the same `faqs` array from `SupportBubble.tsx` (extract to shared constant or duplicate inline) showing the 7 FAQs in an accordion

### 3. Create new component `src/components/profile/ProfileHelpSection.tsx`
Contains:
- Back button + title "Centro de Ayuda"
- Card with bug/incident report form (description textarea, section input, screenshot upload, submit button)
- Card with WhatsApp support info (number: 30616015, link button)
- Card with FAQ accordion (7 questions)

This keeps UserProfile.tsx clean and follows the pattern of `ProfileHistorySection` and `ProfileNotificationsSection`.

