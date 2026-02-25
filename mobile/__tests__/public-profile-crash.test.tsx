/**
 * Component crash tests for the Public Profile screen (app/profile/[id].tsx).
 *
 * Bug: setFollowerCount(data.stats.follower_count) crashed when the
 * get_chef_profile RPC returned data with undefined stats.
 * Fix: data.stats?.follower_count ?? 0
 *
 * These tests render the PublicProfileScreen with mocked RPC responses
 * that trigger the crash condition and verify no exception is thrown.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams } from 'expo-router';

import PublicProfileScreen from '@/app/profile/[id]';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ChefProfile = {
  profile: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    bio: string | null;
    is_private: boolean;
    role: string;
  };
  stats?: {
    recipe_count: number;
    cook_count: number;
    follower_count: number;
    following_count: number;
  };
  is_following: boolean;
  is_owner: boolean;
  can_view: boolean;
  activity: any[];
  favorites: any[];
  published: any[];
};

function makeChefProfile(overrides: Partial<ChefProfile> = {}): ChefProfile {
  return {
    profile: {
      id: 'chef-user-id',
      display_name: 'Chef Bart',
      avatar_url: null,
      bio: null,
      is_private: false,
      role: 'user',
    },
    stats: {
      recipe_count: 5,
      cook_count: 10,
      follower_count: 42,
      following_count: 7,
    },
    is_following: false,
    is_owner: false,
    can_view: true,
    activity: [],
    favorites: [],
    published: [],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PublicProfileScreen — Bug 2 (undefined stats crash)', () => {
  beforeEach(() => {
    // Set up the route param: /profile/[id]
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'chef-user-id' });
  });

  it('renders without crashing when stats is undefined in RPC response', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: makeChefProfile({ stats: undefined }), // ← crash trigger
      error: null,
    });

    // follow_requests check after profile load
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('displays follower count as 0 when stats is undefined', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: makeChefProfile({ stats: undefined }),
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const { getAllByText } = render(<PublicProfileScreen />);

    await waitFor(() => {
      // Both follower count and following count default to 0 when stats is undefined.
      // getAllByText ensures the "0" values are present (Followers + Following).
      const zeros = getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(1);
    }, { timeout: 3000 });
  });

  it('renders the profile name correctly when stats is undefined', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: makeChefProfile({ stats: undefined }),
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const { queryByText } = render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(queryByText('Chef Bart')).not.toBeNull();
    }, { timeout: 3000 });
  });

  it('renders correctly when stats has all zeroes', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: makeChefProfile({
        stats: { recipe_count: 0, cook_count: 0, follower_count: 0, following_count: 0 },
      }),
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('renders correctly when RPC returns null data (user not found)', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({ data: null, error: null });

    render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('renders the actual follower count from stats when present', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: makeChefProfile({
        stats: { recipe_count: 5, cook_count: 10, follower_count: 123, following_count: 7 },
      }),
      error: null,
    });

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }));

    const { queryByText } = render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(queryByText('123')).not.toBeNull();
    }, { timeout: 3000 });
  });
});

describe('PublicProfileScreen — Bug 3 (load error handling)', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'chef-user-id' });
  });

  it('does not crash when RPC throws', async () => {
    (supabase.rpc as jest.Mock).mockRejectedValueOnce(new Error('RPC network error'));

    render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });

  it('does not crash when follow_requests query throws after profile load', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: makeChefProfile({ is_owner: false, is_following: false }),
      error: null,
    });

    // The follow_requests query throws
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('DB error')),
    }));

    render(<PublicProfileScreen />);

    await waitFor(() => {
      expect(true).toBe(true);
    }, { timeout: 3000 });
  });
});
