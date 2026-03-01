---
name: legal-compliance-review
description: Use when implementing any feature that touches user data, social features, content sharing, payments, third-party integrations, or user-generated content — to verify legal pages are current and privacy/compliance obligations are met.
---

# Legal & Compliance Review

## Overview

EefEats has GDPR + CCPA obligations and three legal pages that must stay current. This skill ensures no feature ships without checking compliance impact. A legal page update is a code change like any other — it must be part of the same PR.

## Trigger This Review When

- Adding new data collection (any new field stored about a user)
- Adding social features (follows, likes, shares, public profiles)
- Adding payments or subscriptions
- Integrating third-party services (analytics, ads, affiliate links)
- Changing how recipes are shared or made public
- Adding AI features that process user content
- Changing authentication or account management

## Compliance Checklist

### Data Collection
- [ ] What new personal data does this feature collect?
- [ ] Is there a legal basis for collecting it? (consent / legitimate interest / contract)
- [ ] Is data minimized — collecting only what's needed?
- [ ] Where is it stored? (Supabase EU or US region)
- [ ] How long is it retained? Is there a deletion path?

### GDPR (EU users)
- [ ] Does the user need to consent before this data is collected?
- [ ] Is this data included in the "right to erasure" flow?
- [ ] Is this data exportable (right to portability)?
- [ ] If using a third-party processor: is there a DPA in place?

### CCPA (California users)
- [ ] Does this feature sell or share personal data with third parties?
- [ ] Is there a "Do Not Sell My Personal Information" flow if needed?

### Legal Pages — Update Required?
- [ ] **Privacy Policy** (`src/app/privacy/page.tsx`): Does this change what data is collected, stored, or shared? → Update the policy.
- [ ] **Terms of Service** (`src/app/terms/page.tsx`): Does this change acceptable use, content ownership, or user rights? → Update ToS.
- [ ] **Support page** (`src/app/support/page.tsx`): Does this introduce new user-facing questions or flows? → Update FAQ.

### Content & IP
- [ ] Does this feature allow users to share imported recipes? (Blocked at DB level — verify constraint still holds)
- [ ] Does this feature surface user-generated content publicly? Check `recipe_share_cards` view excludes copyrightable columns.
- [ ] If adding AI processing of recipes: do terms permit model training on user content? (Current answer: no)

## Legal Contacts

- support@eefeats.com — general / support
- privacy@eefeats.com — GDPR/CCPA requests
- legal@eefeats.com — IP and legal notices

## When in Doubt

If a feature touches personal data in a new way and you're unsure: require explicit user consent before enabling it. It's always easier to loosen consent requirements later than to retroactively ask users for consent you should have gotten.
