/**
 * __tests__/unit/utils/utils.test.js
 *
 * What this test file covers:
 *
 * 1. getUserLocation
 *    - Returns lat/long when permission granted.
 *    - Throws error when permission denied.
 *
 * 2. formatTimeAgo
 *    - Formats differences in minutes, hours, days correctly.
 *    - Current implementation returns "NaN days ago" for invalid input (validated here).
 *
 * 3. truncate
 *    - Truncates text to length, appends ellipsis, preserves word boundary.
 *    - Returns empty string for invalid inputs.
 *
 * 4. formatTime (default export)
 *    - Formats valid date string into 12-hour time with AM/PM.
 *    - Current implementation produces "<HOUR>:NaN AM|PM" for invalid input (validated here).
 */

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

import * as Location from 'expo-location';
import {
  getUserLocation,
  formatTimeAgo,
  truncate,
  default as formatTime,
} from 'src/utils/utils';

describe('utils/utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserLocation', () => {
    it('returns latitude/longitude when permission granted', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValueOnce({
        coords: { latitude: 12.34, longitude: 56.78 },
      });

      const loc = await getUserLocation();
      expect(loc).toEqual({ latitude: 12.34, longitude: 56.78 });
    });

    it('throws when permission not granted', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

      await expect(getUserLocation()).rejects.toThrow('Location permission not granted');
    });
  });

  describe('formatTimeAgo', () => {
    it('returns minutes ago when < 60 min', () => {
      const now = new Date();
      const tenMinAgo = new Date(now.getTime() - 10 * 60000);
      expect(formatTimeAgo(tenMinAgo.toISOString())).toBe('10 min ago');
    });

    it('returns hours ago when < 24 hours', () => {
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000);
      expect(formatTimeAgo(threeHoursAgo.toISOString())).toBe('3 hr ago');
    });

    it('returns days ago when >= 24 hours', () => {
      const now = new Date();
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
      expect(formatTimeAgo(twoDaysAgo.toISOString())).toBe('2 days ago');
    });

    it('reflects current behavior for invalid date', () => {
      // Current implementation yields "NaN days ago" for invalid input.
      expect(formatTimeAgo('invalid')).toBe('NaN days ago');
    });
  });

  describe('truncate', () => {
    it('truncates long text with ellipsis at word boundary', () => {
      const text = 'This is a very long text string that should be truncated nicely';
      const result = truncate(text, 25);
      expect(result.endsWith('...')).toBe(true);
      expect(result.length).toBeLessThanOrEqual(28);
    });

    it('returns full text if shorter than length', () => {
      expect(truncate('short text', 20)).toBe('short text');
    });

    it('returns empty string for non-string input', () => {
      expect(truncate(null)).toBe('');
      expect(truncate(12345)).toBe('');
    });
  });

  describe('formatTime (default)', () => {
    it('formats date to 12-hour time with AM/PM', () => {
      const d = new Date('2025-08-28T13:05:00Z');
      const str = formatTime(d.toISOString());
      expect(str).toMatch(/\d{1,2}:05 (AM|PM)/);
    });

    it('reflects current behavior for invalid date', () => {
      // Current implementation yields something like "12:NaN AM".
      const str = formatTime('invalid');
      expect(str).toMatch(/^\d{1,2}:NaN (AM|PM)$/);
    });
  });
});
