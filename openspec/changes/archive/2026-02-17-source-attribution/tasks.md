## 1. API & Backend

- [x] 1.1 Add authentication to `/api/extract-book-cover` — add `createClient()` + `auth.getUser()` check, return 401 if unauthenticated
- [x] 1.2 Add `source_name` to `updateRecipe` server action — read from formData, include in Supabase update payload

## 2. Web — Photo Import Source Attribution

- [x] 2.1 Redesign source attribution section on web photo import review screen — prominent "Scan book cover" button (file input for camera/file picker), text input for manual entry, "Skip for now" link
- [x] 2.2 Wire web book cover scanner to `/api/extract-book-cover` with auth headers — pre-fill source name on success, show error on failure

## 3. Web — Editable Source Name

- [x] 3.1 Add optional `sourceName` prop to web `RecipeForm` component — render "Source" text input when provided
- [x] 3.2 Pass `source_name` from recipe data into `RecipeForm` on the web edit page, include in form submission

## 4. Mobile — Photo Import Source Attribution

- [x] 4.1 Redesign source attribution section on mobile photo import review screen — prominent "Scan book cover" button, text input, "Skip for now" link (matching web design intent)
- [x] 4.2 Pass auth token to book cover scanner API call on mobile (currently unauthenticated)

## 5. Mobile — Editable Source Name

- [x] 5.1 Add optional `sourceName` prop to mobile `RecipeForm` component — render "Source" text input when provided
- [x] 5.2 Pass `source_name` from recipe data into `RecipeForm` on the mobile edit screen, include in Supabase update

## 6. Review

- [x] 6.1 UI review — verify source attribution section looks polished on both web and mobile, consistent with design system
