import { describe, it, expect } from 'vitest';
import { calculateKwh, calculateFlatCost, calculateEvnCost } from '../powerUtils';

describe('Power Utility Calculations', () => {
  describe('calculateKwh', () => {
    it('calculates correct kWh for standard integer inputs', () => {
      // 100W * 2 units * 5 hours = 1000Wh = 1 kWh
      expect(calculateKwh(100, 2, 5)).toBe(1);
      // 1500W * 1 unit * 2 hours = 3000Wh = 3 kWh
      expect(calculateKwh(1500, 1, 2)).toBe(3);
    });

    it('calculates correct kWh for decimal inputs', () => {
      // 150.5W * 1 unit * 4.5 hours = 677.25Wh = 0.67725 kWh
      expect(calculateKwh(150.5, 1, 4.5)).toBeCloseTo(0.67725, 5);
    });

    it('handles zero or invalid values gracefully by returning 0', () => {
      expect(calculateKwh(0, 5, 2)).toBe(0);
      expect(calculateKwh(100, 0, 4)).toBe(0);
      expect(calculateKwh(100, 2, 0)).toBe(0);
      expect(calculateKwh(-100, 2, 5)).toBe(0);
    });
  });

  describe('calculateFlatCost', () => {
    it('calculates correct flat cost without VAT', () => {
      // 10 kWh * 3500 VND = 35000 VND
      expect(calculateFlatCost(10, 3500, false)).toBe(35000);
    });

    it('calculates correct flat cost with 10% VAT', () => {
      // 10 kWh * 3500 VND * 1.1 = 38500 VND
      expect(calculateFlatCost(10, 3500, true)).toBe(38500);
    });

    it('handles zero or negative inputs gracefully by returning 0', () => {
      expect(calculateFlatCost(0, 3500, false)).toBe(0);
      expect(calculateFlatCost(10, -3500, false)).toBe(0);
    });
  });

  describe('calculateEvnCost', () => {
    it('calculates cost for Tier 1 (0 - 50 kWh)', () => {
      // 40 kWh * 1806 = 72240 VND
      expect(calculateEvnCost(40, false)).toBe(72240);
    });

    it('calculates cost for Tier 2 (51 - 100 kWh)', () => {
      // 50 kWh * 1806 + 25 kWh * 1866 = 90300 + 46650 = 136950 VND
      expect(calculateEvnCost(75, false)).toBe(136950);
    });

    it('calculates cost for Tier 3 (101 - 200 kWh)', () => {
      // 50*1806 + 50*1866 + 50*2167 = 90300 + 93300 + 108350 = 291950 VND
      expect(calculateEvnCost(150, false)).toBe(291950);
    });

    it('calculates cost for higher tiers (Tier 4, 5, 6)', () => {
      // 250 kWh: 50*1806 + 50*1866 + 100*2167 + 50*2729 = 90300 + 93300 + 216700 + 136450 = 536750 VND
      expect(calculateEvnCost(250, false)).toBe(536750);
    });

    it('includes 10% VAT correctly for EVN tiers', () => {
      // 50 kWh * 1806 * 1.1 = 90300 * 1.1 = 99330 VND
      expect(calculateEvnCost(50, true)).toBeCloseTo(99330, 2);
    });

    it('handles zero or negative inputs gracefully by returning 0', () => {
      expect(calculateEvnCost(0, false)).toBe(0);
      expect(calculateEvnCost(-50, false)).toBe(0);
    });
  });
});
