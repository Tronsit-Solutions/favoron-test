

## Plan: Fix Support Widget Scrollability

The support panel's content area is too constrained. The `ScrollArea` in the customer service view has `max-h-[300px]` on desktop which cuts off the FAQ list.

### Changes

**`src/components/SupportBubble.tsx`**

1. Add a fixed max-height to the overall panel so it doesn't overflow the viewport: `sm:max-h-[70vh]`
2. Change the customer service view's `ScrollArea` from `max-h-[300px]` to `flex-1 overflow-hidden` and wrap the whole customer-service section in a flex column layout so the WhatsApp button stays pinned at the bottom while FAQs scroll freely
3. Increase desktop panel height or let it grow: change from no height constraint to `sm:h-[480px]` with flex layout so inner views can fill available space

Specifically:
- Panel container: add `flex flex-col` and `sm:max-h-[70vh]`
- Customer service view: wrap in a `flex flex-col flex-1 min-h-0` container so ScrollArea takes remaining space
- ScrollArea: remove fixed `max-h-[300px]`, use `flex-1` instead
- Menu and bug-report views: add `flex-1` overflow handling

