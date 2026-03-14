

## Update Safe Area Insets Implementation

### Changes Needed

**1. `index.html`** - Simplify viewport meta tag
Replace the complex viewport tag with the simpler version:
- Remove `initial-scale=0.8, maximum-scale=1.0, user-scalable=no`
- Keep `viewport-fit=cover`

**2. `src/index.css`** - Add CSS variables and body padding
- Add `:root` variables for safe area insets (`--sat`, `--sab`, `--sal`, `--sar`)
- Add `body` padding for top/bottom safe areas

```css
:root {
  --sat: env(safe-area-inset-top);
  --sab: env(safe-area-inset-bottom);
  --sal: env(safe-area-inset-left);
  --sar: env(safe-area-inset-right);
}

body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

