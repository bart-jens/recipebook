# Creators & Monetization

The creator system enables recipe authors to build an audience and monetize their content. Brands can sponsor canonical recipes for native, non-intrusive promotion. This spec defines the data model and rules — actual payment processing is deferred.

## Creator Model

A creator is a user with `role = 'creator'` in `user_profiles`. Any user can request to become a creator (self-service for invite phase, application-based when open). Creators get an extended profile and the ability to publish subscribers-only recipes.

Creators are NOT a separate user type — they are regular users with additional capabilities. A creator still has their personal recipe collection, can fork recipes, and use all standard features.

---

## ADDED Requirements

### Requirement: Creator profiles table
The database SHALL have a `creator_profiles` table with columns: `id` (uuid, PK, FK to auth.users), `tagline` (text), `website_url` (text), `social_links` (jsonb, default '{}'), `is_verified` (boolean, default false), `subscriber_count` (integer, default 0), `created_at` (timestamptz).

This extends the base `user_profiles` — a creator has both a user profile and a creator profile.

#### Scenario: Becoming a creator
- **WHEN** user A requests creator status and is approved
- **THEN** user A's `user_profiles.role` SHALL be set to 'creator'
- **AND** a `creator_profiles` row SHALL be created

#### Scenario: Creator profile display
- **WHEN** viewing a creator's profile
- **THEN** the tagline, website, social links, and subscriber count SHALL be shown in addition to the standard profile fields

### Requirement: Creator subscriptions table
The database SHALL have a `creator_subscriptions` table with columns: `id` (uuid, PK), `subscriber_id` (uuid, FK to auth.users), `creator_id` (uuid, FK to auth.users), `status` (text, CHECK in: active, cancelled, expired), `started_at` (timestamptz), `expires_at` (timestamptz). Unique constraint on (subscriber_id, creator_id).

#### Scenario: Subscribing to a creator
- **WHEN** user A subscribes to creator B
- **THEN** a row SHALL be created with status 'active' and appropriate expiry

#### Scenario: Accessing subscribers-only recipe
- **GIVEN** user A has an active subscription to creator B
- **WHEN** user A views a subscribers-only recipe by creator B
- **THEN** the recipe content SHALL be accessible

#### Scenario: Non-subscriber blocked from subscribers-only recipe
- **GIVEN** user A does NOT have a subscription to creator B
- **WHEN** user A views a subscribers-only recipe by creator B
- **THEN** the recipe title and description SHALL be shown, but ingredients and instructions SHALL be hidden behind a subscribe prompt

### Requirement: Sponsored recipes
The `recipes` table column `sponsored` (boolean, default false) indicates brand-sponsored content. Additionally, a `sponsor_metadata` (jsonb, nullable) column stores: `sponsor_name` (text), `sponsor_logo_url` (text), `sponsor_url` (text), `campaign_id` (text).

#### Scenario: Displaying a sponsored recipe
- **WHEN** a sponsored recipe appears in discovery or feed
- **THEN** it SHALL show a subtle "Sponsored by [sponsor_name]" label with the sponsor logo
- **AND** the recipe SHALL otherwise look and behave identically to organic recipes

#### Scenario: Sponsored recipe in discovery
- **WHEN** a user browses discovery
- **THEN** sponsored recipes MAY appear in featured/promoted positions
- **AND** there SHALL be no more than 1 sponsored recipe per 10 organic results

#### Scenario: Interacting with sponsored recipes
- **WHEN** a user rates, forks, or cooks a sponsored recipe
- **THEN** it SHALL behave identically to any other canonical recipe (ratings aggregate, forks link back, etc.)

### Requirement: Recipe analytics table (future)
The database SHALL have a `recipe_analytics` table with columns: `id` (uuid, PK), `recipe_id` (uuid, FK to recipes), `event_type` (text, CHECK in: view, cook, fork, share), `user_id` (uuid, nullable, FK to auth.users), `created_at` (timestamptz).

This powers creator dashboards and sponsor reporting. Not needed for v1 but the table should exist to start collecting data early.

#### Scenario: Tracking a recipe view
- **WHEN** a user opens a recipe detail page
- **THEN** a 'view' event SHALL be recorded

#### Scenario: Creator dashboard
- **WHEN** a creator views their dashboard
- **THEN** they SHALL see: total views, total cooks, total forks, and trends over time for each published recipe

### Requirement: Invite system
The system SHALL have an `invites` table with columns: `id` (uuid, PK), `invited_by` (uuid, FK to auth.users), `email` (text, NOT NULL), `code` (text, unique, NOT NULL), `used_at` (timestamptz, nullable), `created_at` (timestamptz). Each user gets a limited number of invite codes (5 for free, 20 for premium, unlimited for creators).

#### Scenario: Sending an invite
- **WHEN** user A generates an invite for "friend@email.com"
- **THEN** an invite code SHALL be created and an email sent

#### Scenario: Redeeming an invite
- **WHEN** a new user signs up with a valid invite code
- **THEN** the `used_at` SHALL be set and the new user's profile SHALL record who invited them

#### Scenario: Invite limit enforced
- **WHEN** a free user has used all 5 invite codes
- **THEN** generating a new invite SHALL be rejected with a message to upgrade

---

## Revenue Streams Summary

### 1. Creator Subscriptions
- Creators set a monthly price for their subscribers-only content
- EefEats takes a platform fee (e.g., 15%)
- Payment processing via Stripe (deferred — start with manual/honor system for beta)

### 2. Sponsored Recipes
- Brands pay per campaign for featured recipe placement
- Pricing: per impression or flat fee per campaign
- Admin dashboard for managing active campaigns (future)

### 3. Premium User Plan
- Monthly subscription unlocking premium features across the platform
- See free/premium tables in social-platform and mobile-app specs

### 4. Affiliate Links (future)
- Ingredient links to grocery delivery services
- Commission per click or per order
- No data model changes needed — feature layer on top of ingredients

---

## Data Model Additions Summary

All new columns to add to `recipes`:
- `visibility` text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'subscribers'))
- `forked_from_id` uuid REFERENCES recipes(id) ON DELETE SET NULL
- `published_at` timestamptz
- `sponsored` boolean NOT NULL DEFAULT false
- `sponsor_metadata` jsonb

All new tables:
- `user_profiles` (id, display_name, avatar_url, bio, role, plan, created_at, updated_at)
- `creator_profiles` (id, tagline, website_url, social_links, is_verified, subscriber_count, created_at)
- `user_follows` (id, follower_id, following_id, created_at)
- `creator_subscriptions` (id, subscriber_id, creator_id, status, started_at, expires_at)
- `invites` (id, invited_by, email, code, used_at, created_at)
- `recipe_analytics` (id, recipe_id, event_type, user_id, created_at)

---

## Free vs Premium Considerations

| Feature | Free | Premium | Creator |
|---|---|---|---|
| Publish public recipes | Up to 10 | Unlimited | Unlimited |
| Subscribers-only recipes | N/A | N/A | Unlimited |
| Invite codes | 5 | 20 | Unlimited |
| Camera imports / month | 5 | Unlimited | Unlimited |
| Offline cached recipes | 10 | Unlimited | Unlimited |
| Analytics dashboard | No | No | Yes |
| Verified badge | No | No | On request |
| Recipe collections/lists | 3 | Unlimited | Unlimited |
