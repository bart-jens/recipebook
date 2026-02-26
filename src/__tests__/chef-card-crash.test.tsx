/**
 * Crash-prevention tests for ChefCard.
 *
 * Bug: displayName[0]?.toUpperCase() crashes when displayName is an empty string
 * or null because the optional chaining is after the index access.
 * Same pattern as ActivityFeed.
 *
 * Fix: (displayName?.[0] ?? '?').toUpperCase()
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChefCard } from '@/app/(authenticated)/discover/chef-card';

// ChefCard imports server actions — mock them
jest.mock('@/app/(authenticated)/profile/actions', () => ({
  followUser: jest.fn().mockResolvedValue(undefined),
  unfollowUser: jest.fn().mockResolvedValue(undefined),
}));

describe('ChefCard — display_name crash', () => {
  const defaultProps = {
    id: 'chef-1',
    displayName: 'Chef Bart',
    avatarUrl: null,
    recipeCount: 5,
    lastCooked: null,
    followState: 'not_following' as const,
  };

  it('renders without crashing when displayName is an empty string', () => {
    render(<ChefCard {...defaultProps} displayName="" />);
    expect(true).toBe(true);
  });

  it('renders the follow button', () => {
    render(<ChefCard {...defaultProps} />);
    expect(screen.getByRole('button', { name: /follow/i })).not.toBeNull();
  });

  it('renders recipe count correctly', () => {
    render(<ChefCard {...defaultProps} recipeCount={7} />);
    expect(screen.getByText('7 recipes')).not.toBeNull();
  });

  it('renders without crashing when lastCooked is null', () => {
    render(<ChefCard {...defaultProps} lastCooked={null} />);
    expect(true).toBe(true);
  });

  it('renders avatar initial from displayName when avatarUrl is null', () => {
    render(<ChefCard {...defaultProps} displayName="Bart" avatarUrl={null} />);
    expect(screen.getByText('B')).not.toBeNull();
  });
});
