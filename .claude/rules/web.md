---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Web App Conventions (Next.js 14)

## Framework
- Next.js 14 with App Router (`src/app/`)
- TypeScript throughout
- Tailwind CSS for styling — use utility classes, not inline styles
- Warm palette inspired by NYT Cooking (defined in `tailwind.config.ts`)

## Routing
- Authenticated routes under `src/app/(authenticated)/`
- Public routes: login (`src/app/login/`), signup (`src/app/signup/`)
- API routes in `src/app/api/`

## Data Layer
- Supabase client in `src/lib/supabase/`
- TypeScript types in `src/types/database.ts` (generated from Supabase schema)
- Server-side data fetching where possible (RSC)
- Client components marked with `'use client'` only when needed

## Recipe Parsing
- All parsers in `src/lib/`: `recipe-parser.ts`, `ingredient-parser.ts`, `claude-extract.ts`, etc.
- All import methods must produce the same structured format
- Ingredient parsing: quantity (decimal), unit (standardized), name, notes

## Quality
- No hardcoded color hex values — use Tailwind config colors
- Responsive design: mobile breakpoints first
- No emoji in user-visible UI strings
