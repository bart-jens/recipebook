---
name: error-state-audit
description: Use when reviewing a feature implementation, before marking it complete, or when the user asks to audit async operations — to verify every async call has all three required UI states: loading, success, and error.
---

# Error State Audit

## Overview

The project rule: **every async operation requires three UI states — loading, success, error.** This skill is the enforcement mechanism. Run it before any feature is marked complete.

## The Rule

A feature spec is incomplete without specifying what the user sees when the fetch fails. If it wasn't specified, Claude will omit the error state. This audit catches that.

## Audit Process

### Step 1: List Every Async Operation

Read the feature code and list every call that:
- Fetches from Supabase (`.from()`, `.rpc()`, `.select()`)
- Calls an external API
- Uploads a file or image
- Performs a mutation (insert, update, delete)
- Requires user authentication

### Step 2: Check Each Operation

For each async operation, verify:

| State | Web | Mobile |
|-------|-----|--------|
| **Loading** | Skeleton / spinner shown before data arrives | ActivityIndicator or skeleton shown |
| **Success** | Data rendered correctly | Data rendered correctly |
| **Error** | Error message shown, user can retry | Error message shown, user can retry |

### Step 3: Check Error Message Quality

Bad error states:
- Silent failure (nothing happens)
- Generic "Something went wrong" with no recovery path
- Crashing (unhandled promise rejection)
- Console.error only (user sees nothing)

Good error states:
- Specific enough for user to understand what failed
- Offers a retry action where feasible
- Doesn't expose internal error details or stack traces to user

## Common Missed Error States

These are the ones most often skipped:

1. **Initial data load** — screen loads but fetch fails: show empty + error, not blank screen
2. **Mutation failures** — save/submit fails: show inline error, don't navigate away
3. **Image upload** — upload fails silently: user thinks it worked
4. **Auth token expiry** — request fails with 401: redirect to login, don't show generic error
5. **Network offline** — no internet: show offline state, not spinner forever
6. **Optimistic updates** — assume success but roll back on failure: UI must revert

## Audit Output Format

For each async operation found:

```
Operation: [description]
Loading state: ✅ / ❌ [description or "missing"]
Success state: ✅ / ❌ [description or "missing"]
Error state:   ✅ / ❌ [description or "missing"]
```

Then: list all ❌ items as required fixes before feature is complete.

## Checklist Before Marking Feature Complete

- [ ] All async operations listed
- [ ] Every operation has loading state
- [ ] Every operation has success state
- [ ] Every operation has error state with user-visible message
- [ ] Error states offer retry where feasible
- [ ] No silent failures
- [ ] Auth error (401) handled globally or per-operation
- [ ] Implemented on both web and mobile (or explicitly scoped to one)
