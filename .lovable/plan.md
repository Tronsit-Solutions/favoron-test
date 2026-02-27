

## Plan: Redesign ReferralBanner with colorful gradient and handshake image

### Changes in `src/components/dashboard/ReferralBanner.tsx`

- Replace the subtle `from-primary/5 to-purple-50` gradient with a vibrant warm gradient (e.g., `from-orange-400 via-pink-500 to-purple-500`) with white text
- Add a small handshake image from Unsplash (e.g., `https://images.unsplash.com/photo-1521790797524-b2497295b8a0?w=200&h=200&fit=crop`) as a decorative element on the left/right side, with rounded corners and slight shadow
- Make the reward amounts stand out with pill-style highlights (e.g., yellow/white badges)
- Update the "Copiar link" button to a white/light style that contrasts with the colorful background
- Add `h-full` so it matches the Hub de Viajes height in the grid
- Keep the completed referrals badge but style it for the new color scheme

### Layout structure
```
[Handshake img] | [Title + description + badge] | [Copy button]
```

On mobile, stack vertically with image hidden or small.

