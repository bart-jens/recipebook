/**
 * Crash-prevention tests for ActivityFeed.
 *
 * Bug: item.display_name[0]?.toUpperCase() crashes when display_name is null
 * because null[0] throws TypeError before ?. can run.
 * Same bug was fixed on mobile in app/(tabs)/index.tsx.
 *
 * Fix: (item.display_name?.[0] ?? '?').toUpperCase()
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '@/app/(authenticated)/home/activity-feed';

type FeedItem = {
  event_type: string;
  user_id: string;
  recipe_id: string;
  event_at: string;
  notes: string | null;
  display_name?: string | null;
  avatar_url: string | null;
  recipe_title: string;
  recipe_image_url: string | null;
  source_url: string | null;
  source_name: string | null;
  rating: number | null;
  recipe_visibility: string;
  recipe_source_type: string;
};

function makeFeedItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    event_type: 'cooked',
    user_id: 'user-1',
    recipe_id: 'recipe-1',
    event_at: new Date().toISOString(),
    notes: null,
    display_name: 'Chef Bart',
    avatar_url: null,
    recipe_title: 'Pasta Carbonara',
    recipe_image_url: null,
    source_url: null,
    source_name: null,
    rating: null,
    recipe_visibility: 'public',
    recipe_source_type: 'manual',
    ...overrides,
  };
}

// Access the global supabase mock from jest.setup.ts
import { createClient } from '@/lib/supabase/client';

describe('ActivityFeed — loadMore error state', () => {
  it('shows error message when RPC fails', async () => {
    // Override the global rpc mock to return an error for this test
    const mockClient = (createClient as jest.Mock).mockReturnValue({
      rpc: jest.fn().mockResolvedValue({ data: null, error: new Error('Network error') }),
    });

    const items = Array.from({ length: 20 }, (_, i) =>
      makeFeedItem({ recipe_id: `recipe-${i}`, event_at: new Date(Date.now() - i * 1000).toISOString() })
    );

    const { findByText, getByRole } = render(
      <ActivityFeed initialItems={items} userId="user-1" hasMore={true} />
    );

    getByRole('button', { name: /load more/i }).click();

    const errorMsg = await findByText(/couldn't load more/i);
    expect(errorMsg).not.toBeNull();
    // Button should be re-enabled (not show as disabled) after error
    const button = getByRole('button', { name: /load more/i });
    expect(button.getAttribute('disabled')).toBeNull();

    mockClient.mockRestore?.();
  });

  it('hides Load more button when hasMore is false', () => {
    const items = Array.from({ length: 20 }, (_, i) =>
      makeFeedItem({ recipe_id: `recipe-${i}`, event_at: new Date(Date.now() - i * 1000).toISOString() })
    );
    const { queryByRole } = render(
      <ActivityFeed initialItems={items} userId="user-1" hasMore={false} />
    );
    expect(queryByRole('button', { name: /load more/i })).toBeNull();
  });
});

describe('ActivityFeed — null display_name crash', () => {
  it('renders without crashing when display_name is null', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: null })]}
        userId="user-1"
        hasMore={false}
      />
    );
    // If we get here, no crash
    expect(true).toBe(true);
  });

  it('renders without crashing when display_name is undefined', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: undefined })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(true).toBe(true);
  });

  it('shows a fallback character when display_name is null (no crash)', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: null })]}
        userId="user-1"
        hasMore={false}
      />
    );
    // Fixed code renders '?' as fallback initial
    expect(screen.getByText('?')).not.toBeNull();
  });

  it('renders the recipe title even when display_name is null', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ display_name: null, recipe_title: 'Pasta Carbonara' })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(screen.getByText('Pasta Carbonara')).not.toBeNull();
  });

  it('renders an empty feed without crashing', () => {
    render(<ActivityFeed initialItems={[]} userId="user-1" hasMore={false} />);
    expect(true).toBe(true);
  });

  it('renders multiple items where some have null display_name', () => {
    render(
      <ActivityFeed
        initialItems={[
          makeFeedItem({ display_name: 'Alice', recipe_title: 'Risotto' }),
          makeFeedItem({ display_name: null, recipe_title: 'Pasta' }),
          makeFeedItem({ display_name: 'Bob', recipe_title: 'Soup' }),
        ]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(screen.getByText('Risotto')).not.toBeNull();
    expect(screen.getByText('Pasta')).not.toBeNull();
    expect(screen.getByText('Soup')).not.toBeNull();
  });

  it('handles null rating without crashing', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ rating: null, event_type: 'cooked' })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(true).toBe(true);
  });

  it('handles null source_url and source_name without crashing', () => {
    render(
      <ActivityFeed
        initialItems={[makeFeedItem({ source_url: null, source_name: null })]}
        userId="user-1"
        hasMore={false}
      />
    );
    expect(true).toBe(true);
  });
});
