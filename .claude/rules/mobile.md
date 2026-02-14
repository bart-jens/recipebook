---
paths:
  - "mobile/**/*.ts"
  - "mobile/**/*.tsx"
---

# Mobile App Conventions (React Native / Expo)

## Design System
- Import colors, spacing, typography, radii, and shadows from `mobile/lib/theme.ts`
- Never hardcode hex color values — always use theme tokens
- Use `colors.primary`, `colors.background`, `colors.text`, etc.
- Use `spacing.sm`, `spacing.lg`, etc. — not raw numbers for padding/margin
- Use `typography.h1`, `typography.body`, etc. for text styles
- Use `radii.md`, `radii.lg` for border radius values
- Use the shared `shadows` export for elevation/shadow styles

## Navigation
- Uses Expo Router (file-based routing in `mobile/app/`)
- Tab navigation in `mobile/app/(tabs)/`
- Auth flow in `mobile/app/(auth)/`
- Stack screens for detail views (e.g., `mobile/app/recipe/[id]/`)

## Patterns
- Auth context in `mobile/contexts/auth.tsx` — use `useAuth()` hook
- Supabase client in `mobile/lib/` — same instance as web, shared database
- Components in `mobile/components/` — reusable UI components go here
- Shared UI primitives in `mobile/components/ui/`

## Quality
- Minimum 44x44pt tap targets on all interactive elements
- Always handle loading, empty, and error states with styled UI
- Test on both iOS and Android visual rendering
- No emoji characters in any user-visible strings
