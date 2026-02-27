

## Plan: Replace WhatsApp button with clickable phone number

Replace the non-functional "Escríbenos por WhatsApp" button with the actual WhatsApp number `+502 3061-6015` displayed as a clickable link.

### Changes

**`src/components/SupportBubble.tsx`** (lines 336-342)
- Replace green button with a link showing the number: `+502 3061-6015`
- Link href: `https://wa.me/50230616015` (direct number format that works reliably)
- Keep green styling and WhatsApp icon

**`src/components/support/ChatbotView.tsx`** (lines 105-110)
- Same change: replace "Hablar con una persona" button with the phone number link using `https://wa.me/50230616015`

