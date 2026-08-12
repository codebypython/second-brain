import { describe, it, expect } from 'vitest';
import { convertScore10ToLetter, convertLetterToScore4, calculateCumulativeGpa } from '../gpaUtils';

describe('GPA Utility Calculations (DUT Standard)', () => {
  describe('convertScore10ToLetter', () => {
    it('converts scores to letter grades correctly', () => {
      expect(convertScore10ToLetter(9.5)).toBe('A');
      expect(convertScore10ToLetter(8.5)).toBe('A');
      expect(convertScore10ToLetter(8.4)).toBe('B');
      expect(convertScore10ToLetter(7.0)).toBe('B');
      expect(convertScore10ToLetter(6.9)).toBe('C');
      expect(convertScore10ToLetter(5.5)).toBe('C');
      expect(convertScore10ToLetter(5.4)).toBe('D');
      expect(convertScore10ToLetter(4.0)).toBe('D');
      expect(convertScore10ToLetter(3.9)).toBe('F');
      expect(convertScore10ToLetter(0)).toBe('F');
    });

    it('returns empty string for null or invalid scores', () => {
      expect(convertScore10ToLetter(null)).toBe('');
      expect(convertScore10ToLetter(undefined)).toBe('');
      expect(convertScore10ToLetter(-1)).toBe('');
    });
  });

  describe('convertLetterToScore4', () => {
    it('converts letter grades to GPA 4.0 scale correctly', () => {
      expect(convertLetterToScore4('A')).toBe(4.0);
      expect(convertLetterToScore4('B')).toBe(3.0);
      expect(convertLetterToScore4('C')).toBe(2.0);
      expect(convertLetterToScore4('D')).toBe(1.0);
      expect(convertLetterToScore4('F')).toBe(0.0);
    });

    it('returns null for special statuses I, X, R', () => {
      expect(convertLetterToScore4('I')).toBeNull();
      expect(convertLetterToScore4('X')).toBeNull();
      expect(convertLetterToScore4('R')).toBeNull();
      expect(convertLetterToScore4('')).toBeNull();
      expect(convertLetterToScore4(null)).toBeNull();
    });
  });

  describe('calculateCumulativeGpa', () => {
    it('calculates GPA correctly for a list of standard courses', () => {
      const courses = [
        { name: 'Môn A', credits: 3, status: 'passed', score4: 4.0 },
        { name: 'Môn B', credits: 2, status: 'passed', score4: 3.0 },
        { name: 'Môn C', credits: 3, status: 'passed', score4: 2.0 },
      ];
      // Weighted GPA = (3*4 + 2*3 + 3*2) / 8 = (12 + 6 + 6) / 8 = 24 / 8 = 3.00
      expect(calculateCumulativeGpa(courses)).toBe(3.00);
    });

    it('handles course retaking correctly by taking the maximum score4', () => {
      const courses = [
        { name: 'Giải tích', code: '101', credits: 3, status: 'failed', score4: 0.0 },
        { name: 'Giải tích', code: '101', credits: 3, status: 'passed', score4: 3.0 },
        { name: 'Đại số', code: '102', credits: 3, status: 'passed', score4: 2.0 },
      ];
      // Weighted GPA should use the retaken pass grade (3.0) for 'Giải tích'
      // GPA = (3*3.0 + 3*2.0) / 6 = (9 + 6) / 6 = 2.50
      expect(calculateCumulativeGpa(courses)).toBe(2.50);
    });

    it('skips courses that are not passed/failed or have I, X, R letters', () => {
      const courses = [
        { name: 'Môn A', credits: 3, status: 'passed', score4: 4.0 },
        { name: 'Môn B', credits: 2, status: 'studying', score4: null }, // studying -> skip
        { name: 'Môn C', credits: 3, status: 'not_started', score4: null }, // not started -> skip
        { name: 'Môn D', credits: 2, status: 'passed', score4: null, gradeLetter: 'R' }, // exempt/recognized -> skip
      ];
      // GPA = (3*4.0) / 3 = 4.00
      expect(calculateCumulativeGpa(courses)).toBe(4.00);
    });

    it('returns 0.00 if there are no completed courses with credits', () => {
      expect(calculateCumulativeGpa([])).toBe(0.00);
    });
  });
});
