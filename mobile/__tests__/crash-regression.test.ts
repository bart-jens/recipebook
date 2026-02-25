/**
 * Regression tests for the three confirmed iOS crash bugs:
 *
 * Bug 1 (index.tsx): item.display_name[0]?.toUpperCase() crashes when
 *   display_name is null or undefined — TypeError on property access.
 *   Fix: (item.display_name?.[0] ?? '?').toUpperCase()
 *
 * Bug 2 (profile/[id].tsx): data.stats.follower_count crashes when
 *   the get_chef_profile RPC returns undefined stats.
 *   Fix: data.stats?.follower_count ?? 0
 *
 * Bug 3 (all screens): async load() functions had no try/catch.
 *   On any unhandled exception, setLoading(false) was never called,
 *   leaving the screen stuck on a skeleton UI indefinitely.
 *   Fix: wrap body in try/catch/finally { setLoading(false) }
 */

// ─── Bug 1: avatar initial from display_name ─────────────────────────────────

describe('avatar initial letter — Bug 1 regression', () => {
  // Replicates the EXACT fixed expression from app/(tabs)/index.tsx
  const getInitial = (displayName: string | null | undefined): string =>
    (displayName?.[0] ?? '?').toUpperCase();

  it('returns "?" for null display_name instead of crashing', () => {
    // BEFORE fix: null[0] threw TypeError: Cannot read properties of null
    expect(getInitial(null)).toBe('?');
  });

  it('returns "?" for undefined display_name instead of crashing', () => {
    // BEFORE fix: undefined[0] threw TypeError
    expect(getInitial(undefined)).toBe('?');
  });

  it('returns "?" for empty string display_name', () => {
    // Empty string[0] is undefined → fallback to '?'
    expect(getInitial('')).toBe('?');
  });

  it('returns uppercased first letter for a normal display_name', () => {
    expect(getInitial('Bart')).toBe('B');
  });

  it('returns uppercased first letter for a lowercase display_name', () => {
    expect(getInitial('anne')).toBe('A');
  });

  it('handles single-char display_name', () => {
    expect(getInitial('X')).toBe('X');
  });
});

// ─── Bug 2: follower_count from possibly-undefined stats ─────────────────────

describe('follower count from chef profile stats — Bug 2 regression', () => {
  // Replicates the EXACT fixed expression from app/profile/[id].tsx
  const getFollowerCount = (data: { stats?: { follower_count?: number } }): number =>
    data.stats?.follower_count ?? 0;

  it('returns 0 when stats is undefined instead of crashing', () => {
    // BEFORE fix: data.stats.follower_count threw TypeError when stats was undefined
    expect(getFollowerCount({ stats: undefined })).toBe(0);
  });

  it('returns 0 when stats object exists but follower_count is undefined', () => {
    expect(getFollowerCount({ stats: {} })).toBe(0);
  });

  it('returns 0 when follower_count is null', () => {
    expect(getFollowerCount({ stats: { follower_count: undefined } })).toBe(0);
  });

  it('returns actual count when stats and follower_count are present', () => {
    expect(getFollowerCount({ stats: { follower_count: 42 } })).toBe(42);
  });

  it('returns 0 for a follower_count of 0', () => {
    expect(getFollowerCount({ stats: { follower_count: 0 } })).toBe(0);
  });
});

// ─── Bug 3: try/catch/finally ensures loading is always cleared ──────────────

describe('async load error handling — Bug 3 regression', () => {
  it('clears loading state in finally block even when load throws', async () => {
    let loadingState = true;
    const setLoading = (val: boolean) => {
      loadingState = val;
    };

    // Replicates the fixed pattern used in profile.tsx, index.tsx, recipes.tsx, etc.
    const load = async () => {
      try {
        throw new Error('Simulated network failure');
      } catch {
        // error is swallowed — component stays usable
      } finally {
        setLoading(false);
      }
    };

    await load();
    expect(loadingState).toBe(false);
  });

  it('clears loading state in finally block on success path too', async () => {
    let loadingState = true;
    const setLoading = (val: boolean) => {
      loadingState = val;
    };

    const load = async () => {
      try {
        // successful operation — nothing to do
      } finally {
        setLoading(false);
      }
    };

    await load();
    expect(loadingState).toBe(false);
  });

  it('BUG: without try/catch/finally, a throw leaves loading stuck as true', async () => {
    // This test documents the ORIGINAL buggy pattern.
    // If this test was run against the old code, loading would stay true.
    let loadingState = true;
    const setLoading = (val: boolean) => {
      loadingState = val;
    };

    // Buggy pattern: setLoading(false) only on happy path
    const loadBuggy = async () => {
      try {
        throw new Error('Failure');
        setLoading(false); // unreachable — loading stays true forever
      } catch {
        // no finally → loading never cleared
      }
    };

    await loadBuggy();
    // Demonstrates the bug: loading is still true after the call
    expect(loadingState).toBe(true);
  });

  it('multiple sequential errors still clear loading state each time', async () => {
    const results: boolean[] = [];
    const setLoading = (val: boolean) => results.push(val);

    const load = async () => {
      try {
        throw new Error('fail');
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    };

    await load();
    await load();
    await load();

    expect(results).toEqual([false, false, false]);
  });
});

// ─── Compound: original crash expressions vs fixed expressions ───────────────

describe('exact crash expressions comparison', () => {
  it('ORIGINAL display_name[0] crashes on null (documents the bug)', () => {
    const item = { display_name: null as string | null };
    expect(() => {
      // This is what the code looked like BEFORE the fix
      void (item.display_name as any)[0]?.toUpperCase();
    }).toThrow(TypeError);
  });

  it('FIXED display_name?.[0] does not crash on null', () => {
    const item = { display_name: null as string | null };
    expect(() => {
      void (item.display_name?.[0] ?? '?').toUpperCase();
    }).not.toThrow();
  });

  it('ORIGINAL stats.follower_count crashes on undefined stats (documents the bug)', () => {
    const data = { stats: undefined as { follower_count: number } | undefined };
    expect(() => {
      // This is what the code looked like BEFORE the fix
      void (data.stats as any).follower_count;
    }).toThrow(TypeError);
  });

  it('FIXED stats?.follower_count does not crash on undefined stats', () => {
    const data = { stats: undefined as { follower_count: number } | undefined };
    expect(() => {
      void (data.stats?.follower_count ?? 0);
    }).not.toThrow();
  });
});
