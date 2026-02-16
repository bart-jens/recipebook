## Context

The current EefEats UI uses a dual-font system (Fraunces serif + DM Sans), colored teal header bars, gradient overlays on cards, subtle shadows everywhere, uppercase letter-spaced section headers, and filled pill filters. While individually subtle, these patterns stack into a 2018-2019 aesthetic that feels heavy compared to modern consumer apps.

The reference apps (Coinbase, Notion, Wise, ClassPass) share a common philosophy: near-monochrome palettes, single typeface families, flat surfaces, generous whitespace, and color reserved for interactive elements only.

This is a pure frontend change — no database, API, or business logic modifications.

## Goals / Non-Goals

**Goals:**
- Modernize the visual feel to match contemporary consumer app standards
- Simplify the design system (fewer tokens, fewer variants, less cognitive load)
- Maintain full feature parity — every screen keeps its functionality
- Apply changes to both web and mobile simultaneously

**Non-Goals:**
- Rebranding (the teal accent color stays, the EefEats name stays)
- Layout restructuring (screen flows, navigation structure, information architecture remain the same)
- New features or functionality
- Dark mode (future consideration)
- New component library or design system tooling

## Decisions

### 1. Single typeface: DM Sans only

**Decision**: Remove Fraunces entirely. Use DM Sans at different weights (400, 500, 600, 700) for all text.

**Alternative considered**: Keep Fraunces for recipe detail title only. Rejected because the mix between screens creates inconsistency — either commit to the serif or remove it. The "less is more" direction calls for removal.

**Exception**: The "EefEats" logo text in the web header may optionally keep serif if it reads as a logo rather than UI text.

### 2. Color palette simplification

**Decision**: Reduce from 6+ surface/border variants to 3 core neutrals.

| Token | Old value | New value | Purpose |
|-------|-----------|-----------|---------|
| background | #FFFFFF | #FFFFFF | Page background |
| surface | #F1F5F9 | #F5F5F5 | Input backgrounds, inactive elements |
| border | #E2E8F0 | #E8E8E8 | Borders, dividers |
| text | #1A1A1A | #111111 | Primary text |
| textSecondary | #6B7280 | #666666 | Secondary text |
| textMuted | #9CA3AF | #999999 | Muted text, placeholders |
| primary | #2D5F5D | #2D5F5D | Interactive elements only (keep) |

Remove: `surfaceAlt`, `warm-tag`, `warm-surface`, all gradient tokens except overlay for images.

### 3. Flat cards — no shadows

**Decision**: Remove all box shadows from cards. Use either a 1px border (#E8E8E8) or no container at all (content floats on white).

**Rationale**: Shadows create depth hierarchy that competes with content. Flat cards with thin borders are the dominant pattern in modern apps.

### 4. Title below image, not overlaid

**Decision**: Recipe card titles move below the image. Remove gradient overlays used for text readability.

**Rationale**: Text overlaid on images via gradient is a pattern from media-heavy apps circa 2017. Modern apps keep text and images as separate zones — cleaner, more readable, and works better when images have varied contrast.

### 5. Web header: white background

**Decision**: Replace the solid teal `bg-accent` header with a white background, dark text, and a thin bottom border.

**Alternative considered**: Very light gray header. Rejected — white is cleaner and matches the reference apps.

### 6. Pill-shaped primary buttons, ghost secondary

**Decision**:
- Primary buttons: teal fill, border-radius `full` (pill-shaped)
- Secondary buttons: transparent background, 1px border, border-radius `full`
- Remove filled gray background from secondary buttons

### 7. Text-based filter tabs instead of filled pills

**Decision**: Replace sort/filter pills (teal background when active) with text-only tabs. Active state = semibold text + 2px bottom underline in teal.

### 8. Section headers: normal case

**Decision**: Replace `textTransform: uppercase` + `letterSpacing: 1.5` + bottom border with normal-case text, 500 weight, 15px size, no border. Use spacing to separate sections.

### 9. Press feedback: opacity, not scale

**Decision**: Replace the spring-physics scale animation (0.97x) on card press with a simple opacity change (0.7). Keep spring physics for the favorite heart only.

### 10. Home screen: content-first

**Decision**: Remove the stats grid (recipes/favorites/cooked). The greeting becomes smaller (body size, secondary color). Content sections (recent recipes, recommendations) move up as the primary content.

### 11. Placeholder cards: flat gray

**Decision**: Remove teal gradient backgrounds from recipe cards without images. Use light gray (#F5F5F5) background with a thin border. No icon.

### 12. Spacing increases

**Decision**:
- Mobile horizontal padding: 16px → 20px
- Section gaps: 24px → 32px
- Card content padding: 12px → 16px

## Risks / Trade-offs

- **Loss of warmth**: Removing the serif font and gradients makes the app more "tech" and less "cookbook." → Mitigation: The teal accent color and food photography provide enough warmth. The cleaner UI actually lets the food images shine more.
- **Carousel card size impact**: Moving titles below images means carousel cards need more vertical space. → Mitigation: Slightly reduce image aspect ratio from 3:2 to 4:3 in carousels to compensate.
- **Brand identity weakening**: The serif/sans combo was a differentiator. → Mitigation: Brand identity should come from the product experience, not font gimmicks. DM Sans at various weights is distinctive enough.
- **Big diff**: This touches nearly every component and screen file. → Mitigation: Phase the work — theme tokens first (cascades everywhere), then components, then screens.
