# Typography Simplification: Warm Minimal

**Date:** 2026-02-21
**Status:** Approved

## Context

The current UI uses 3 font families (Instrument Serif, Inter Tight, Geist Mono) with 15-17 distinct font sizes, 9-11 letter-spacing values, and heavy uppercase treatment. The result feels messy — too many competing typographic voices on every screen. Mono alone accounts for 50% of all font declarations on web.

The goal: simplify to "less is more." One font family, strict type scale, no shouting.

## Direction: Warm Minimal

One font family. Hierarchy through size and lightness. Everything whispers.

### Type Scale (8 tokens)

| Token | Size | Weight | Tracking | Use |
|-------|------|--------|----------|-----|
| `title` | 36px | Light (300) | -0.03em | Page titles (Recipes, Discover, profile name) |
| `heading` | 26px | Regular (400) | -0.01em | Section headings, featured recipe title |
| `subheading` | 20px | Regular (400) | 0 | Recipe names in lists, card titles |
| `body` | 15px | Light (300) | 0 | Body text, descriptions, activity text |
| `bodySmall` | 13px | Light (300) | 0 | Secondary text, notes, bios |
| `label` | 14px | Regular (400) | 0 | Nav links, buttons, form labels |
| `meta` | 12px | Regular (400) | +0.02em | Timestamps, cook times, "By author" |
| `metaSmall` | 11px | Regular (400) | +0.02em | Tag labels, stat labels, overlines |

### Rules

- **Font**: Inter Tight only. Drop Instrument Serif and Geist Mono entirely.
- **Weights**: 300 (Light) and 400 (Regular). No Medium, SemiBold, or Bold.
- **Uppercase**: None. Everything in normal/sentence case.
- **Letter-spacing**: 3 values only: -0.03em (tight), 0 (normal), +0.02em (wide).
- **Emphasis**: Use Regular (400) within Light (300) body text for inline emphasis (names, recipe titles in feeds), instead of bold.

### Removed

- Greeting masthead ("Good morning, [Name]") — removed from home page
- Instrument Serif (display font) — dropped
- Geist Mono (monospace font) — dropped
- All `text-transform: uppercase` — removed
- Font weights 500, 600, 700 — removed

### Unchanged

- Color palette (ink, bg, border, accent, olive)
- Layout structure and spacing
- Component hierarchy (featured recipe, recipe index, activity feed, stats bar)
- Background color (#f5f2ed)

## Scope

### Web (src/)

- Update `tailwind.config.ts`: remove `font-display` and `font-mono` families, keep only `font-body`/`font-sans`
- Update `globals.css`: remove Instrument Serif and Geist Mono imports, remove `.mono-label`, `.mono-meta`, `.serif-title` utility classes
- Update `layout.tsx`: remove unused font imports
- Replace all `font-display` classes with `font-body` at appropriate weight
- Replace all `font-mono` classes with `font-body` at appropriate weight
- Remove all `uppercase` and `tracking-[*]` classes (except the 3 approved values)
- Consolidate all `text-[Npx]` to the 8-token scale
- Remove greeting masthead from home page

### Mobile (mobile/)

- Update `mobile/lib/theme.ts`: reduce `fontFamily` to Inter Tight 300 + 400 only, update `typography` presets to match 8-token scale
- Update all component files to use theme presets instead of inline `fontSize`/`fontFamily`
- Remove all `textTransform: 'uppercase'` styles
- Remove Instrument Serif and Geist Mono font loading from app config

### Both Platforms

- Every screen must be visually reviewed after changes
- The 8-token scale is the source of truth — no inline overrides

## Preview

Design preview: `docs/design-preview/typo-b-warm-minimal.html`

## Migration Strategy

This is a large surface-area change (touches most component files). Recommended approach:
1. Update theme files first (single source of truth)
2. Work screen by screen, starting with home page
3. Review each screen visually before moving to the next
4. Web and mobile in parallel for each screen to maintain parity
