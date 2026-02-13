## 1. Setup

- [x] 1.1 Install Anthropic SDK (`@anthropic-ai/sdk`)
- [x] 1.2 Add `ANTHROPIC_API_KEY` to `.env.local` and `.env.example`

## 2. Claude Extraction Module

- [x] 2.1 Create `src/lib/claude-extract.ts` — shared module that takes a base64 image and returns structured recipe data via Claude Vision API
- [x] 2.2 Create `src/lib/claude-extract-text.ts` — module that takes plain text (Instagram caption) and returns structured recipe data via Claude API

## 3. Import Page

- [x] 3.1 Create `/recipes/import-instagram/page.tsx` with two-tab UI: "Paste Caption" and "Upload Image"
- [x] 3.2 Create `/recipes/import-instagram/actions.ts` server actions for caption extraction and image extraction
- [x] 3.3 Wire up caption paste → Claude text extraction → pre-fill RecipeForm
- [x] 3.4 Wire up image upload → base64 conversion → Claude Vision extraction → pre-fill RecipeForm
- [x] 3.5 Handle error states: no recipe found, API errors, unsupported file types
- [x] 3.6 Set `source_type: "instagram"` when saving imported recipes

## 4. Navigation

- [x] 4.1 Add "Import from Instagram" link to recipe list page alongside existing import/new buttons

## 5. Styling

- [x] 5.1 Apply EefEats warm design tokens to import-instagram page (serif headings, accent colors, warm borders)

## 6. Build & Deploy

- [ ] 6.1 Verify `npm run build` passes
- [ ] 6.2 Commit and push to GitHub
- [ ] 6.3 Add `ANTHROPIC_API_KEY` to Vercel environment variables
- [ ] 6.4 Test end-to-end: paste caption → review → save, upload image → review → save
