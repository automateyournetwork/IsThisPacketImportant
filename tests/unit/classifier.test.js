/**
 * Classifier Module Tests
 *
 * Tests DSCP classification logic against RFC 4594 specifications.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  initClassifier,
  isInitialized,
  classify,
  getClass,
  getClassesByCategory,
  getCategoryForClass,
  dscpToBinary,
  binaryToDscp,
  getAllClasses,
  hasClass,
  getRfcReference,
  isClassUnlocked,
} from '../../src/lib/classifier.js';

// Sample DSCP classes data for testing
const mockDscpData = {
  version: '1.0.0',
  categories: [
    { id: 'EF', name: 'Expedited Forwarding' },
    { id: 'AF', name: 'Assured Forwarding' },
    { id: 'CS', name: 'Class Selector' },
    { id: 'BE', name: 'Best Effort' },
  ],
  classes: [
    {
      id: 'EF',
      name: 'Expedited Forwarding',
      category: 'EF',
      dscp: 46,
      dscpBinary: '101110',
      phbBehavior: 'Low latency, low jitter',
      rfcReference: { rfc: 4594, section: '4.7', title: 'Telephony' },
    },
    {
      id: 'AF41',
      name: 'Assured Forwarding 41',
      category: 'AF',
      dscp: 34,
      dscpBinary: '100010',
      phbBehavior: 'High-priority assured forwarding',
      rfcReference: { rfc: 4594, section: '4.6', title: 'Real-Time Interactive' },
      afClass: 4,
      dropPrecedence: 1,
    },
    {
      id: 'AF11',
      name: 'Assured Forwarding 11',
      category: 'AF',
      dscp: 10,
      dscpBinary: '001010',
      phbBehavior: 'Low priority assured forwarding',
      rfcReference: { rfc: 4594, section: '4.8', title: 'High-Throughput Data' },
      afClass: 1,
      dropPrecedence: 1,
    },
    {
      id: 'CS1',
      name: 'Class Selector 1',
      category: 'CS',
      dscp: 8,
      dscpBinary: '001000',
      phbBehavior: 'Low priority data',
      rfcReference: { rfc: 4594, section: '4.10', title: 'Low-Priority Data' },
    },
    {
      id: 'BE',
      name: 'Best Effort',
      category: 'BE',
      dscp: 0,
      dscpBinary: '000000',
      phbBehavior: 'Default forwarding',
      rfcReference: { rfc: 4594, section: '4.12', title: 'Standard' },
    },
  ],
};

describe('Classifier Module', () => {
  beforeEach(() => {
    initClassifier(mockDscpData);
  });

  describe('initClassifier', () => {
    it('should initialize with valid data', () => {
      expect(isInitialized()).toBe(true);
    });

    it('should populate class cache', () => {
      expect(getAllClasses()).toHaveLength(5);
    });
  });

  describe('classify', () => {
    it('should return correct for matching classification', () => {
      const result = classify('EF', 'EF');
      expect(result.correct).toBe(true);
      expect(result.selectedClass).toBe('EF');
      expect(result.correctClass).toBe('EF');
    });

    it('should return incorrect for mismatched classification', () => {
      const result = classify('BE', 'EF');
      expect(result.correct).toBe(false);
      expect(result.selectedClass).toBe('BE');
      expect(result.correctClass).toBe('EF');
    });

    it('should include feedback message', () => {
      const correct = classify('EF', 'EF');
      expect(correct.feedback).toContain('Correct');

      const incorrect = classify('BE', 'EF');
      expect(incorrect.feedback).toContain('Incorrect');
    });

    it('should throw for unknown class', () => {
      expect(() => classify('UNKNOWN', 'EF')).toThrow('Unknown class');
    });
  });

  describe('getClass', () => {
    it('should return class by ID', () => {
      const efClass = getClass('EF');
      expect(efClass).toBeDefined();
      expect(efClass.dscp).toBe(46);
      expect(efClass.dscpBinary).toBe('101110');
    });

    it('should return undefined for unknown class', () => {
      expect(getClass('UNKNOWN')).toBeUndefined();
    });
  });

  describe('getClassesByCategory', () => {
    it('should return all classes in AF category', () => {
      const afClasses = getClassesByCategory('AF');
      expect(afClasses).toHaveLength(2);
      expect(afClasses.map(c => c.id)).toContain('AF41');
      expect(afClasses.map(c => c.id)).toContain('AF11');
    });

    it('should return empty array for category with no classes', () => {
      const classes = getClassesByCategory('NONEXISTENT');
      expect(classes).toHaveLength(0);
    });
  });

  describe('getCategoryForClass', () => {
    it('should return category for EF', () => {
      expect(getCategoryForClass('EF')).toBe('EF');
    });

    it('should return category for AF classes', () => {
      expect(getCategoryForClass('AF41')).toBe('AF');
      expect(getCategoryForClass('AF11')).toBe('AF');
    });

    it('should return undefined for unknown class', () => {
      expect(getCategoryForClass('UNKNOWN')).toBeUndefined();
    });
  });

  describe('dscpToBinary', () => {
    it('should convert DSCP 46 to 101110', () => {
      expect(dscpToBinary(46)).toBe('101110');
    });

    it('should convert DSCP 0 to 000000', () => {
      expect(dscpToBinary(0)).toBe('000000');
    });

    it('should convert DSCP 63 to 111111', () => {
      expect(dscpToBinary(63)).toBe('111111');
    });

    it('should throw for out of range values', () => {
      expect(() => dscpToBinary(-1)).toThrow();
      expect(() => dscpToBinary(64)).toThrow();
    });
  });

  describe('binaryToDscp', () => {
    it('should convert 101110 to DSCP 46', () => {
      expect(binaryToDscp('101110')).toBe(46);
    });

    it('should convert 000000 to DSCP 0', () => {
      expect(binaryToDscp('000000')).toBe(0);
    });

    it('should throw for invalid binary string', () => {
      expect(() => binaryToDscp('12345')).toThrow();
      expect(() => binaryToDscp('1010')).toThrow(); // Too short
      expect(() => binaryToDscp('10101010')).toThrow(); // Too long
    });
  });

  describe('hasClass', () => {
    it('should return true for existing class', () => {
      expect(hasClass('EF')).toBe(true);
      expect(hasClass('AF41')).toBe(true);
    });

    it('should return false for non-existing class', () => {
      expect(hasClass('UNKNOWN')).toBe(false);
    });
  });

  describe('getRfcReference', () => {
    it('should return RFC reference for class', () => {
      const ref = getRfcReference('EF');
      expect(ref).toBeDefined();
      expect(ref.rfc).toBe(4594);
      expect(ref.section).toBe('4.7');
    });

    it('should return undefined for unknown class', () => {
      expect(getRfcReference('UNKNOWN')).toBeUndefined();
    });
  });

  describe('isClassUnlocked', () => {
    it('should return true if category is unlocked', () => {
      expect(isClassUnlocked('EF', ['EF', 'BE'])).toBe(true);
      expect(isClassUnlocked('AF41', ['EF', 'AF', 'BE'])).toBe(true);
    });

    it('should return false if category is not unlocked', () => {
      expect(isClassUnlocked('AF41', ['EF', 'BE'])).toBe(false);
      expect(isClassUnlocked('CS1', ['EF', 'AF', 'BE'])).toBe(false);
    });

    it('should return false for unknown class', () => {
      expect(isClassUnlocked('UNKNOWN', ['EF', 'AF', 'CS', 'BE'])).toBe(false);
    });
  });

  // RFC 4594 Compliance Tests
  describe('RFC 4594 Compliance', () => {
    it('should map telephony to EF (DSCP 46)', () => {
      const efClass = getClass('EF');
      expect(efClass.dscp).toBe(46);
      expect(efClass.rfcReference.section).toBe('4.7');
    });

    it('should map real-time interactive to AF41 (DSCP 34)', () => {
      const af41Class = getClass('AF41');
      expect(af41Class.dscp).toBe(34);
      expect(af41Class.rfcReference.section).toBe('4.6');
    });

    it('should map high-throughput data to AF11 (DSCP 10)', () => {
      const af11Class = getClass('AF11');
      expect(af11Class.dscp).toBe(10);
      expect(af11Class.rfcReference.section).toBe('4.8');
    });

    it('should map low-priority data to CS1 (DSCP 8)', () => {
      const cs1Class = getClass('CS1');
      expect(cs1Class.dscp).toBe(8);
      expect(cs1Class.rfcReference.section).toBe('4.10');
    });

    it('should map standard traffic to BE (DSCP 0)', () => {
      const beClass = getClass('BE');
      expect(beClass.dscp).toBe(0);
      expect(beClass.rfcReference.section).toBe('4.12');
    });
  });
});
