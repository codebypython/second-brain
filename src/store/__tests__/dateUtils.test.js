/**
 * Tests for dateUtils.js — timezone-aware date formatting
 */
import { describe, it, expect } from 'vitest';
import { getTodayStr, getCurrentHour, getGreetingKey, formatFullDate, TIMEZONES } from '../dateUtils';

describe('Date Utilities', () => {
  describe('getTodayStr', () => {
    it('returns YYYY-MM-DD format', () => {
      const result = getTodayStr('Asia/Ho_Chi_Minh');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('falls back to ISO date on invalid timezone', () => {
      const result = getTodayStr('Invalid/Timezone');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns valid date for all supported timezones', () => {
      for (const tz of TIMEZONES) {
        const result = getTodayStr(tz);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });
  });

  describe('getCurrentHour', () => {
    it('returns a number between 0 and 23', () => {
      const hour = getCurrentHour('Asia/Ho_Chi_Minh');
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });

    it('falls back to local hour on invalid timezone', () => {
      const hour = getCurrentHour('Invalid/Timezone');
      expect(hour).toBeGreaterThanOrEqual(0);
      expect(hour).toBeLessThanOrEqual(23);
    });
  });

  describe('getGreetingKey', () => {
    it('returns valid greeting keys', () => {
      const validKeys = ['dash.morning', 'dash.afternoon', 'dash.evening'];
      const result = getGreetingKey('Asia/Ho_Chi_Minh');
      expect(validKeys).toContain(result);
    });
  });

  describe('formatFullDate', () => {
    it('formats date in Vietnamese locale', () => {
      const result = formatFullDate('2026-08-12', 'vi', 'Asia/Ho_Chi_Minh');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(5);
    });

    it('formats date in English locale', () => {
      const result = formatFullDate('2026-08-12', 'en', 'America/New_York');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('handles year boundary correctly', () => {
      const result = formatFullDate('2026-12-31', 'vi', 'Asia/Ho_Chi_Minh');
      expect(result).toBeTruthy();
    });

    it('handles Jan 1st correctly', () => {
      const result = formatFullDate('2027-01-01', 'en', 'UTC');
      expect(result).toBeTruthy();
    });

    it('falls back to dateStr on invalid input', () => {
      const result = formatFullDate('invalid', 'vi', 'Asia/Ho_Chi_Minh');
      // Should not crash, returns something
      expect(result).toBeTruthy();
    });
  });

  describe('TIMEZONES', () => {
    it('contains expected timezones', () => {
      expect(TIMEZONES).toContain('Asia/Ho_Chi_Minh');
      expect(TIMEZONES).toContain('UTC');
      expect(TIMEZONES.length).toBeGreaterThanOrEqual(10);
    });
  });
});
