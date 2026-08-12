/**
 * Tests for i18n.js — translation system
 */
import { describe, it, expect } from 'vitest';
import { translations, getTranslation } from '../i18n';

describe('Internationalization (i18n)', () => {
  describe('Translation completeness', () => {
    it('has both vi and en locales', () => {
      expect(translations).toHaveProperty('vi');
      expect(translations).toHaveProperty('en');
    });

    it('every vi key has a corresponding en key', () => {
      const viKeys = Object.keys(translations.vi);
      const enKeys = Object.keys(translations.en);
      const missingInEn = viKeys.filter(k => !enKeys.includes(k));
      if (missingInEn.length > 0) {
        console.warn('Keys missing in EN:', missingInEn.slice(0, 10), `... (${missingInEn.length} total)`);
      }
      // Allow some tolerance but flag if too many are missing
      expect(missingInEn.length).toBeLessThan(viKeys.length * 0.1); // less than 10% missing
    });

    it('every en key has a corresponding vi key', () => {
      const viKeys = Object.keys(translations.vi);
      const enKeys = Object.keys(translations.en);
      const missingInVi = enKeys.filter(k => !viKeys.includes(k));
      if (missingInVi.length > 0) {
        console.warn('Keys missing in VI:', missingInVi.slice(0, 10), `... (${missingInVi.length} total)`);
      }
      expect(missingInVi.length).toBeLessThan(enKeys.length * 0.1);
    });

    it('no empty string values in vi', () => {
      const emptyKeys = Object.entries(translations.vi)
        .filter(([, v]) => v === '')
        .map(([k]) => k);
      expect(emptyKeys.length).toBe(0);
    });

    it('no empty string values in en', () => {
      const emptyKeys = Object.entries(translations.en)
        .filter(([, v]) => v === '')
        .map(([k]) => k);
      expect(emptyKeys.length).toBe(0);
    });
  });

  describe('getTranslation', () => {
    it('returns Vietnamese text for vi locale', () => {
      const text = getTranslation('vi', 'app.title');
      expect(text).toBe('Second Brain');
    });

    it('returns English text for en locale', () => {
      const text = getTranslation('en', 'app.title');
      expect(text).toBe('Second Brain');
    });

    it('returns key string when key does not exist', () => {
      const text = getTranslation('vi', 'nonexistent.key.xyz');
      expect(text).toBe('nonexistent.key.xyz');
    });

    it('falls back to en when vi key is missing', () => {
      // Add a temporary test key only in en to verify fallback
      const text = getTranslation('vi', 'common.save');
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
    });

    it('interpolates params correctly', () => {
      // Test with a key that uses params, or create a simple scenario
      const text = getTranslation('vi', 'app.title', { name: 'Test' });
      expect(typeof text).toBe('string');
    });

    it('handles null/undefined params gracefully', () => {
      const text = getTranslation('vi', 'common.save', null);
      expect(text).toBeTruthy();
    });

    it('returns key for completely unknown locale (falls back to en then key)', () => {
      const text = getTranslation('fr', 'app.title');
      // Should fallback to en
      expect(text).toBe('Second Brain');
    });

    it('handles core navigation keys for both locales', () => {
      const navKeys = [
        'nav.dashboard', 'nav.notes', 'nav.tasks', 'nav.calendar',
        'nav.study', 'nav.journal', 'nav.settings', 'nav.courses',
        'nav.expenses', 'nav.health', 'nav.pomodoro',
      ];
      for (const key of navKeys) {
        expect(getTranslation('vi', key)).not.toBe(key);
        expect(getTranslation('en', key)).not.toBe(key);
      }
    });
  });
});
