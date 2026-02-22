# Frontend Redesign: Type-Heavy Modernist

**Date:** 2026-02-20
**Status:** Approved
**Prototype:** `docs/design-preview/type-heavy-modernist-v2.html`

## Design Direction

"Type-Heavy Modernist" — editorial, typography-forward design inspired by high-end food magazines and developer tools (Linear, Raycast). Light theme, warm but not boring. Typography IS the design.

## Key Decisions

- **Light theme** (warm, not sterile white)
- **Typography-forward** — text is the star, photos support
- **Warm & inviting** emotional register
- **Micro-interactions** as primary "wow" factor (not scroll-driven animations)
- **Food-related logo mark** — solid circle with negative fork cutout

## Typography

| Role | Font | Weight | Usage |
|------|------|--------|-------|
| Display | Instrument Serif | Regular + Italic | Headings, recipe titles, section titles, stats values |
| Body | Inter Tight | 300-700 | Body text, descriptions, UI labels |
| Mono | Geist Mono | 400-500 | Metadata, categories, timestamps, nav labels |

### Type Scale
- Recipe detail title: 40px Instrument Serif
- Featured title: 28px Instrument Serif
- Index item title: 20px Instrument Serif
- Section title: 18px Instrument Serif
- Body: 14px Inter Tight
- Labels/meta: 10-11px Geist Mono (uppercase, tracked)

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg` | `#F6F4EF` | Page background (warm cream) |
| `surface` | `#FFFFFF` | Cards, modals |
| `surface-alt` | `#EDEADE` | Alternative surface |
| `ink` | `#141210` | Primary text |
| `ink-secondary` | `#5C5850` | Secondary text, descriptions |
| `ink-muted` | `#9C978C` | Placeholders, timestamps |
| `border` | `#D6D2C8` | Borders (warm, not gray) |
| `border-strong` | `#141210` | Thick rules, emphasis borders |
| `accent` | `#8B4513` | Primary accent (burnt sienna) — CTAs, links, active states |
| `accent-light` | `rgba(139,69,19,0.07)` | Hover backgrounds |
| `olive` | `#4A5D3A` | Published badge, success states |

## Logo

- Solid dark circle (`ink` color) with a fork cut out as negative space
- Fork: 4 thin parallel tines, curved bridge, slender handle
- 20px mark alongside "EefEats" in Inter Tight bold (700), -0.03em tracking
- See SVG mask implementation in prototype

## Layout Principles

- Max-width: 480px (mobile-first)
- Page padding: 20px
- **Horizontal rules as design elements** — 3px thick rules (ink), 1px thin rules (border), double rules for emphasis
- **No rounded corners on images** — square/rectangular crops
- **No shadows** — depth through typography scale and rules
- **Monospace for all metadata** — uppercase, tracked, small
- **Serif for all content titles** — creates the editorial feel

## Component Patterns

### Navigation
- Sticky, blurred background
- Logo left, mono nav links + avatar right
- Active link: underline with offset

### Greeting (Home)
- Compact single-line masthead
- Italic serif greeting left, mono date right
- Below a thin border — not a hero section

### Featured Recipe
- Two-column grid: text (1fr) + small image (130px)
- Mono category label, large serif title, light body excerpt, mono metadata
- Image hover: scale(1.04)

### Recipe Index
- Numbered list with large serif numbers (ghost color, accent on hover)
- Serif titles (20px), mono metadata
- Small square thumbnails (56px)
- Hover: expand with accent-light background, image scale-up

### Activity Feed
- Small recipe thumbnails (36px) per item
- Bold name + italic serif recipe name in accent color
- Right-aligned mono timestamp
- Star ratings in accent color
- Hover: expand with accent background, image spring-scale

### Recipe Detail
- Parallax hero image (220px, zoom 1.08 -> 1)
- Bottom gradient fade to background
- Mono back/share/save text-link actions
- Large title (40px), mono category, light byline
- Stats bar: 3px top border, 1px bottom, serif values, mono labels
- Italic serif description/intro
- **Interactive ingredient checkboxes**: spring pop animation on check, accent fill, strikethrough with accent color
- **Step numbers**: leading-zero format (01, 02), accent on hover

### Discover
- Serif title + mono overline
- Search: bottom-border style (2px ink, accent on focus)
- Mono uppercase filter tabs with active underline
- Results with small thumbnails (56px) — same style as home index
- Hover: expand with accent background

### Profile
- Left-aligned: 64px avatar + serif name + light bio
- Stats bar matching detail page (3px/1px borders)
- Mono nav tabs with active underline
- Recipe list: 48px thumbs, border badges (Published/Private)

## Animations & Interactions

### Page Load
- Staggered fadeInUp (0.55s, cubic-bezier(0.16, 1, 0.3, 1))
- ~40ms delay between elements
- Horizontal rules: scaleX from left (0.6s)

### Hover States
- Recipe items: expand padding, accent-light background, title color change
- Images: scale(1.08) with spring bezier
- Index numbers: color transition to accent
- Nav avatar: scale(1.12) with spring bezier (0.34, 1.56, 0.64, 1)

### Press States
- Tab bar items: scale(0.88) with spring bounce-back
- Action buttons: scale(0.94)
- Back button: translateX(-3px)
- Recipe items: scale(0.995)

### Interactive Elements
- Ingredient checkboxes: spring pop (checkPop keyframe), accent fill, checkmark reveal
- Ingredient text: strikethrough with accent color, amount fades
- Search border: color transition on focus
- Stats: highlight on hover

### Recipe Detail Hero
- Image: scale(1.08) -> scale(1) over 0.8s (parallax feel)
- Bottom gradient fade to background color

## Platform Implementation Notes

### Web (Next.js / Tailwind)
- Extend Tailwind config with full color palette
- Add Instrument Serif + Geist Mono to font imports
- Custom animation utilities for fadeInUp, lineGrow, etc.
- Intersection Observer for scroll-triggered stagger animations

### Mobile (React Native / Expo)
- Update `theme.ts` with new color tokens and typography
- Use Reanimated for spring animations and parallax
- Expo Google Fonts for Instrument Serif + Geist Mono
- Gesture Handler for press interactions

### Shared
- Both platforms use same color tokens and typography scale
- Animation timing/easing should match across platforms
- Logo SVG exported as component for both platforms
