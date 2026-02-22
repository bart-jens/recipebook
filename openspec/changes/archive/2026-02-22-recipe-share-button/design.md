## Approach

Minimal external sharing: a public recipe page at `/r/{id}` with OG meta tags, plus a share button on recipe detail (web + mobile) that triggers the native share sheet or copies the link.

## Key Decisions

### Public recipe route at `/r/{id}`
Short URL path for sharing. Renders a read-only recipe page for unauthenticated visitors. Only works for `visibility = 'public'` recipes — private recipes show a gate with sign-up prompt. Uses the Supabase anon key (public recipes are readable via RLS, no admin client needed).

### Middleware whitelist
Add `/r/` to the unauthenticated path whitelist alongside `/login` and `/signup`.

### OG meta tags via `generateMetadata()`
Dynamic metadata on the public page: title, description, image, og:url. This gives rich previews in iMessage, WhatsApp, Slack, Twitter, etc.

### Share button naming
The existing "Share" button means "recommend to followers" (internal social feature). The new external share button will be labeled with a share icon (link/arrow-up) without the word "Share" to avoid confusion. On web: icon button in the action bar. On mobile: icon button in the header or action bar.

### No new DB tables
No share tokens, no share tracking table. Just a public URL. Analytics can be added later if needed.

## Data Flow

```
User taps share → native share sheet opens with URL
  → Recipient opens https://eefeats.com/r/{id}
    → Public page fetches recipe (anon key, RLS allows public)
    → Renders read-only recipe with OG meta
    → CTA: "Sign up to save this recipe"
```
