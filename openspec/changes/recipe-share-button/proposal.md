## Why

EefEats has no way for users to share a recipe outside the platform. Someone finds a great recipe on Discover or wants to send their own creation to a friend — there's no share button, no shareable link, no social card preview. Users can't text a recipe to their partner or post it on Instagram. This is the #1 organic growth lever for any content platform, and it's completely missing. Every share is a potential new user.

## What Changes

- Public recipes get a shareable URL at `/recipe/{id}` that works for non-logged-in visitors (public recipe detail page)
- Share button on recipe detail pages (web + mobile) using native share sheet (Web Share API / React Native Share)
- Open Graph meta tags on public recipe pages for rich previews in iMessage, WhatsApp, Slack, Twitter, etc.
- Private recipe sharing via a time-limited link token (share with a specific person without making the recipe fully public)
- Share tracking for analytics (count shares per recipe, no PII)

## Capabilities

### New Capabilities
- `recipe-share-links`: Shareable URLs, public recipe pages for non-authenticated visitors, private share tokens, OG meta tags
- `recipe-share-ui`: Share button on recipe detail, native share sheet integration, share tracking

### Modified Capabilities

## Impact

- **Web**: Public recipe detail pages need to work for unauthenticated visitors. OG meta tags require server-side rendering of recipe metadata. New share button component.
- **Mobile**: Share button on recipe detail using React Native's Share API. Deep linking to recipe URLs.
- **Database**: New `recipe_share_tokens` table for private sharing. Optional `recipe_share_events` table for tracking.
- **SEO/Growth**: Public recipe pages become indexable, shareable, and preview-friendly — direct growth channel.
