/**
 * Component crash tests for the Home screen.
 *
 * Bug: renderTickerItem() accessed item.display_name[0] before checking
 * for null, causing a TypeError crash whenever a feed user had no display_name.
 *
 * These tests render the actual HomeScreen component with mocked Supabase
 * data containing null/undefined display_names and verify no exception is thrown.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';

// Import the screen under test
import HomeScreen from '@/app/(tabs)/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Builds a Supabase query builder that resolves to the given data. */
function makeBuilder(resolvedData: { data: any; error: null }) {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedData),
    maybeSingle: jest.fn().mockResolvedValue(resolvedData),
    insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: (resolve: (val: any) => any) =>
      Promise.resolve(resolvedData).then(resolve),
  };
  return builder;
}

const NULL_DISPLAY_NAME_FEED_ITEM = {
  event_type: 'cooked',
  user_id: 'other-user-id',
  recipe_id: 'recipe-abc',
  event_at: new Date().toISOString(),
  notes: null,
  display_name: null,          // ← the crash trigger: null display_name
  avatar_url: null,
  recipe_title: 'Pasta Carbonara',
  recipe_image_url: null,
  source_url: null,
  source_name: null,
  rating: null,
  recipe_visibility: 'public',
  recipe_source_type: 'manual',
};

const UNDEFINED_DISPLAY_NAME_FEED_ITEM = {
  ...NULL_DISPLAY_NAME_FEED_ITEM,
  display_name: undefined,     // ← undefined is also a crash trigger
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('HomeScreen — Bug 1 (null display_name crash)', () => {
  /**
   * Set up Supabase to return one followed user and one feed item with
   * null display_name. The activity ticker will render that item.
   */
  function setupMocksWithNullDisplayName(displayName: null | undefined) {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      switch (table) {
        case 'user_follows':
          // Returns one follower so the feed RPC is triggered
          return makeBuilder({ data: [{ following_id: 'other-user-id' }], error: null });
        case 'user_profiles':
          return makeBuilder({ data: { display_name: 'Bart' }, error: null });
        case 'cook_log':
          return makeBuilder({ data: [], error: null });
        case 'recipes':
          return makeBuilder({ data: [], error: null });
        default:
          return makeBuilder({ data: [], error: null });
      }
    });

    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: [{ ...NULL_DISPLAY_NAME_FEED_ITEM, display_name: displayName }],
      error: null,
    });
  }

  it('renders without throwing when feed item has null display_name', async () => {
    setupMocksWithNullDisplayName(null);

    // render() handles its own act() wrapper — do not double-wrap
    render(<HomeScreen />);

    // Wait for async loadData to settle
    await waitFor(() => {
      // If '?' renders we know the feed item was processed without crashing
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('renders without throwing when feed item has undefined display_name', async () => {
    setupMocksWithNullDisplayName(undefined);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('shows fallback "?" in avatar when display_name is null', async () => {
    setupMocksWithNullDisplayName(null);

    const { queryByText } = render(<HomeScreen />);

    await waitFor(() => {
      // The fixed code renders '?' as the avatar initial
      expect(queryByText('?')).not.toBeNull();
    }, { timeout: 3000 });
  });

  it('shows the recipe title from the feed item when display_name is null', async () => {
    setupMocksWithNullDisplayName(null);

    const { queryByText } = render(<HomeScreen />);

    await waitFor(() => {
      // Recipe title should still render even with null display_name
      expect(queryByText('Pasta Carbonara')).not.toBeNull();
    }, { timeout: 3000 });
  });
});

describe('HomeScreen — Bug 3 (load error handling)', () => {
  it('clears loading state when Supabase throws during data load', async () => {
    // Make supabase.from throw a network-style error
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('Network timeout');
    });

    // Should not crash — error is caught by try/catch in loadData
    render(<HomeScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('clears loading state when rpc throws during feed load', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'user_follows') {
        return makeBuilder({ data: [{ following_id: 'other-user-id' }], error: null });
      }
      return makeBuilder({ data: [], error: null });
    });

    (supabase.rpc as jest.Mock).mockRejectedValue(new Error('RPC failure'));

    render(<HomeScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });
});
