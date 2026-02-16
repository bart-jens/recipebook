## 1. Design Tokens (cascades to everything)

- [x] 1.1 Update mobile theme colors: simplify palette (remove surfaceAlt, gradientWarm*, reduce to single surface #F5F5F5, border #E8E8E8, text #111111, textSecondary #666666, textMuted #999999)
- [x] 1.2 Update mobile theme typography: remove all serif/Fraunces references, update sectionTitle to normal case (remove uppercase + letterSpacing), update display styles to use DM Sans
- [x] 1.3 Update mobile theme radii: add `full: 999` for pill buttons (if not present)
- [x] 1.4 Update mobile theme shadows: remove all shadow definitions (set to zero/none)
- [x] 1.5 Update mobile theme animation: remove spring scale config for cards (keep for heart), change press feedback to opacity-based
- [x] 1.6 Update mobile theme spacing: increase section gap and page padding values
- [x] 1.7 Update web Tailwind config: simplify color palette to match mobile tokens, remove gradient-start/gradient-end, remove serif font family
- [x] 1.8 Update web globals.css: remove Fraunces font import

## 2. Mobile Components

- [x] 2.1 Update RecipeCard: remove gradient overlay, move title below image, flat gray placeholder (no gradient/icon), use 1px border instead of shadow
- [x] 2.2 Update AnimatedCard: replace scale spring animation with opacity press feedback (activeOpacity 0.7)
- [x] 2.3 Update Button: change border-radius to `full` (pill shape), secondary variant gets transparent bg + 1px border, remove filled gray background
- [x] 2.4 Update SectionHeader: remove uppercase transform, remove letter spacing, remove bottom border, use medium weight normal-case text at 15px
- [x] 2.5 Update EmptyState: simplify to dashed border container with text + optional CTA link, remove any Lottie/animation/icon usage
- [x] 2.6 Update Badge: ensure no shadows, simplify styling to match flat design
- [x] 2.7 Update HorizontalCarousel: ensure cards use updated flat style, adjust aspect ratio to 4:3

## 3. Mobile Screens

- [x] 3.1 Update Home screen: remove stats grid, make greeting smaller (body size, secondary color), remove teal from greeting text, increase section gaps to 32px
- [x] 3.2 Update Recipes screen: replace sort/filter pills with text-based underline tabs, increase page padding to 20px
- [x] 3.3 Update Recipe Detail screen: update serif references to sans, update section headers (Ingredients/Preparation) to normal-case style, remove gradient overlays
- [x] 3.4 Update Discover screen: same filter/sort tab treatment as Recipes, ensure flat card style
- [x] 3.5 Update Profile screen: remove any shadows or gradients, ensure flat clean layout, remove teal from stat numbers

## 4. Web Layout & Header

- [x] 4.1 Update authenticated layout header: white background, dark text logo, gray nav links that darken on hover, thin bottom border, remove gradient shadow line
- [x] 4.2 Remove serif font usage from web pages (change font-serif classes to font-sans where used for recipe titles)

## 5. Web Screens

- [x] 5.1 Update Home page: remove stats grid, simplify greeting, remove gradient placeholders, remove shadow-sm/shadow-md from cards, use border instead
- [x] 5.2 Update Recipes page: replace pill filters with text underline tabs, remove shadows from recipe rows, simplify card styling
- [x] 5.3 Update Discover page: same flat card treatment, remove gradients and shadows
- [x] 5.4 Update Profile page: remove shadows, ensure flat clean layout
- [x] 5.5 Update Recipe Detail page (web): remove serif font from title, simplify section headers, remove gradient/shadow treatments

## 6. Cleanup & Verification

- [x] 6.1 Search codebase for any remaining Fraunces/serif references and remove them
- [x] 6.2 Search codebase for any remaining shadow usage and remove it
- [x] 6.3 Search codebase for any remaining gradient usage (except image overlays on detail parallax) and remove it
- [x] 6.4 Run build on both platforms to verify no broken imports/references
- [x] 6.5 Visual review of all screens for consistency
