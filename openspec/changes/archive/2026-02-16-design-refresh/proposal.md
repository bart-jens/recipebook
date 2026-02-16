## Why

The current UI feels dated — dual font families, gradient overlays, colored header bars, shadow-heavy cards, and uppercase section headers are patterns from 2018-2019. Modern consumer apps (Coinbase, Notion, Wise, ClassPass) achieve a premium feel through restraint: single typeface, near-monochrome palettes, flat surfaces, and generous whitespace. This refresh aligns EefEats with that standard.

## What Changes

- **Typography**: Drop Fraunces (serif). Use DM Sans everywhere. Create hierarchy through weight and size only.
- **Color usage**: Pull teal back to interactive elements only. Remove colored header (web), teal greeting text, teal stat numbers. Simplify surface/border palette.
- **Cards**: Remove all shadows. Remove gradient overlays on images. Move recipe titles below images instead of overlaid. Use 1px borders or nothing.
- **Section headers**: Replace uppercase + letter-spacing + bottom border with normal-case medium-weight text.
- **Buttons**: Pill-shaped (full radius) primary buttons. Ghost with border for secondary. Remove filled gray backgrounds.
- **Filters/sort**: Replace colored pill backgrounds with text-based tabs (underline or bold for active state).
- **Spacing**: Increase section gaps and page padding for more breathing room.
- **Web header**: White background with dark text navigation, thin bottom border.
- **Home screen**: Remove dashboard-style stats grid. Lead with content.
- **Empty states**: Simplify to white + dashed border + text. No gradients or icons.
- **Press feedback**: Replace spring scale animation with simple opacity change.

## Capabilities

### New Capabilities
- `visual-design-system`: Design tokens, typography scale, color palette, component visual specs (spacing, borders, radii, shadows) shared across web and mobile.

### Modified Capabilities
- `mobile-visual`: Updated visual treatment — flat cards, single typeface, reduced color, simplified animations.

## Impact

- **Mobile theme** (`mobile/lib/theme.ts`): Major token changes — colors, typography, shadows, animations, radii.
- **Web Tailwind config** (`tailwind.config.ts`): Updated color palette, removed gradient tokens.
- **Web globals** (`src/app/globals.css`): Remove Fraunces font import.
- **Web layout** (`src/app/(authenticated)/layout.tsx`): White header redesign.
- **All mobile components** using gradients, shadows, serif fonts, uppercase headers.
- **All mobile screens** — home, recipes, discover, profile, recipe detail.
- **All web pages** — home, recipes, discover, profile, recipe detail.
- **No database changes.** No API changes. Pure frontend.
