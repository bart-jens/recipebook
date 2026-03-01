---
name: rollout-strategy
description: Use when preparing to ship a feature — to plan staged rollout, define success metrics, set rollback criteria, and ensure the release is controlled and measurable.
---

# Rollout Strategy

## Overview

Features should ship in stages, not all-at-once. This is especially important for EefEats during the invite-only phase — a bad experience for early users is hard to recover from. Define what "working" means before you ship.

## Rollout Stages

### Stage 1: Internal (Bart + wife only)
- Enable for `user_id` allowlist or feature flag
- Purpose: catch obvious breakage, UX friction, missing states
- Duration: 1–3 days of real use
- Exit criteria: no crashes, all 3 UI states work, data looks correct in DB

### Stage 2: Trusted Invitees
- Enable for existing invite-only users (current base)
- Purpose: validate with real usage patterns
- Duration: 3–7 days
- Exit criteria: error rate < 1%, no data integrity issues, positive qualitative signal

### Stage 3: New Invitees / General Availability
- Enable for all users
- Purpose: scale validation
- Monitor: DB load, query performance, error spikes

## Pre-Ship Checklist

- [ ] All 3 UI states implemented: loading, success, error
- [ ] Instrumentation added (what events will you track?)
- [ ] Success metric defined (what does good look like in 7 days?)
- [ ] Rollback plan: can you disable this without a deploy? (feature flag / DB toggle)
- [ ] Legal review done (invoke `legal-compliance-review` skill)
- [ ] Platform parity: implemented on both web and mobile, or explicitly scoped to one
- [ ] RLS audited if any new DB tables or policies
- [ ] Legal pages updated if needed

## Success Metrics

Define before shipping — not after. For each feature, answer:
1. What user action proves the feature is being used?
2. What metric proves it's working well (not just used)?
3. What's the threshold that would trigger a rollback?

**Example:** For "recipe rating" feature:
- Usage: >= 20% of recipe views result in a rating within 7 days
- Quality: average rating submission < 3s load time
- Rollback: error rate on rating submission > 5%

## Rollback Criteria

Define explicitly. A rollback should be a calm decision, not a panic.

- Error rate threshold that triggers rollback
- Data integrity issue that triggers rollback
- Performance degradation threshold
- Who makes the call (Bart)

## Comms (when relevant)

For invite-only phase: no announcement needed for minor features. For significant new features visible to all users: post in community channel or send in-app notification.
