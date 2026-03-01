---
name: analytics-instrumentation
description: Use when implementing any user-facing feature — to define success metrics, identify what events to track, and ensure the feature is measurable before it ships.
---

# Analytics Instrumentation

## Overview

A feature you can't measure is a feature you can't improve. Before writing implementation code, answer: "How will we know if this worked?" Define the metric first, then instrument it.

## The Core Question

**"What user action proves this feature is working as intended?"**

Write the answer before writing code. If you can't answer it, the feature requirements are incomplete.

## Instrumentation Checklist

For every user-facing feature:

- [ ] **Success event defined**: What action = "feature used successfully"?
- [ ] **Engagement metric defined**: What action = "feature is valuable"? (repeat use, not just first use)
- [ ] **Error event defined**: What do we log when things go wrong?
- [ ] **Funnel start/end defined**: If multi-step, what's entry and completion?
- [ ] **Baseline captured**: What's the current behavior before this feature?

## Event Naming Convention

```
{noun}_{verb}

recipe_viewed
recipe_cooked_marked
recipe_forked
recipe_rated
recipe_imported
user_followed
collection_created
subscription_started
```

Events are past tense (things that happened). Keep names stable — changing event names breaks historical analysis.

## What to Track Per Event

Minimum payload for any event:
```json
{
  "event": "recipe_rated",
  "user_id": "...",
  "timestamp": "...",
  "properties": {
    "recipe_id": "...",
    "recipe_type": "original|imported|forked",
    "rating_value": 4,
    "platform": "web|mobile"
  }
}
```

Always include: `user_id`, `timestamp`, `platform`. Add domain-specific properties relevant to the feature.

## Metrics by Feature Type

| Feature Type | Primary Metric | Secondary Metric |
|---|---|---|
| Discovery / Browse | Click-through rate on results | Session depth |
| Social (follows, likes) | Follow/like rate per view | Retention of followed users |
| Creation (recipes) | Recipes created per active user | Publish rate (draft → published) |
| Import | Import completion rate | Return view rate on imported recipes |
| Monetization | Conversion rate | Revenue per user |
| Cooking mode | Cooking session completion rate | Time in session |

## EefEats-Specific Signals

These are the signals that prove EefEats' social bet is working:
- **Social graph growth**: follows per week, graph density
- **Cooked activity**: `recipe_cooked_marked` events (the key differentiator — "I made this")
- **Fork rate**: how often users fork vs. just save
- **Creator engagement**: views-to-follow conversion on creator profiles
- **Recipe discovery source**: how did user find this recipe? (feed, search, friend activity, direct)

## Where to Implement

- **Web**: Use a lightweight analytics call or Supabase logging table
- **Mobile**: Same — consistent event names across platforms
- **Database**: For some signals, a Supabase `user_events` table or existing `user_activity` log may be sufficient before adding a third-party analytics service

## Checklist Before Shipping

- [ ] At least one success event instrumented
- [ ] Error states logged (not just tracked in UI)
- [ ] Event names consistent between web and mobile
- [ ] No PII in event payloads (no email, no full names)
- [ ] Metric has a defined "good" threshold (for rollout review)
