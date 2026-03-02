import { formatTime, formatTimeAgo } from '../lib/format';

describe('formatTime', () => {
  it('returns null for null input', () => expect(formatTime(null)).toBeNull());
  it('returns null for 0', () => expect(formatTime(0)).toBeNull());
  it('returns "45 min" for 45', () => expect(formatTime(45)).toBe('45 min'));
  it('returns "1h" for 60', () => expect(formatTime(60)).toBe('1h'));
  it('returns "1h 30m" for 90', () => expect(formatTime(90)).toBe('1h 30m'));
  it('returns "2h" for 120', () => expect(formatTime(120)).toBe('2h'));
  it('returns "2h 5m" for 125', () => expect(formatTime(125)).toBe('2h 5m'));
});

describe('formatTimeAgo', () => {
  it('returns "just now" for very recent timestamps', () => {
    const now = new Date().toISOString();
    expect(formatTimeAgo(now)).toBe('just now');
  });

  it('returns minutes for timestamps < 1 hour ago', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    expect(formatTimeAgo(thirtyMinsAgo)).toBe('30m ago');
  });

  it('returns hours for timestamps < 1 day ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days for timestamps < 1 week ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(threeDaysAgo)).toBe('3d ago');
  });

  it('returns weeks for timestamps < 5 weeks ago', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(twoWeeksAgo)).toBe('2w ago');
  });
});
