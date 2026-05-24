/**
 * Classification Rules Integration Tests
 *
 * Verifies all classification rules in the game comply with RFC 4594.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

let levelData;
let dscpClasses;

beforeAll(async () => {
  const levelPath = path.join(PROJECT_ROOT, 'content', 'level-01.json');
  const dscpPath = path.join(PROJECT_ROOT, 'content', 'dscp-classes.json');

  const [levelContent, dscpContent] = await Promise.all([
    readFile(levelPath, 'utf-8'),
    readFile(dscpPath, 'utf-8'),
  ]);

  levelData = JSON.parse(levelContent);
  dscpClasses = JSON.parse(dscpContent);
});

describe('Classification Rules - RFC 4594 Compliance', () => {
  describe('DSCP Classes Data', () => {
    it('should have all four PHB categories', () => {
      const categoryIds = dscpClasses.categories.map(c => c.id);
      expect(categoryIds).toContain('EF');
      expect(categoryIds).toContain('AF');
      expect(categoryIds).toContain('CS');
      expect(categoryIds).toContain('BE');
    });

    it('should have EF class with DSCP 46', () => {
      const efClass = dscpClasses.classes.find(c => c.id === 'EF');
      expect(efClass).toBeDefined();
      expect(efClass.dscp).toBe(46);
      expect(efClass.dscpBinary).toBe('101110');
    });

    it('should have correct AF class DSCP values per RFC 2597', () => {
      // AF DSCP = 8*class + 2*drop_precedence
      const afMappings = [
        { id: 'AF11', dscp: 10, class: 1, drop: 1 },
        { id: 'AF12', dscp: 12, class: 1, drop: 2 },
        { id: 'AF13', dscp: 14, class: 1, drop: 3 },
        { id: 'AF21', dscp: 18, class: 2, drop: 1 },
        { id: 'AF22', dscp: 20, class: 2, drop: 2 },
        { id: 'AF23', dscp: 22, class: 2, drop: 3 },
        { id: 'AF31', dscp: 26, class: 3, drop: 1 },
        { id: 'AF32', dscp: 28, class: 3, drop: 2 },
        { id: 'AF33', dscp: 30, class: 3, drop: 3 },
        { id: 'AF41', dscp: 34, class: 4, drop: 1 },
        { id: 'AF42', dscp: 36, class: 4, drop: 2 },
        { id: 'AF43', dscp: 38, class: 4, drop: 3 },
      ];

      for (const mapping of afMappings) {
        const afClass = dscpClasses.classes.find(c => c.id === mapping.id);
        expect(afClass, `Missing AF class ${mapping.id}`).toBeDefined();
        expect(afClass.dscp, `${mapping.id} DSCP mismatch`).toBe(mapping.dscp);
        expect(afClass.afClass, `${mapping.id} class number mismatch`).toBe(mapping.class);
        expect(afClass.dropPrecedence, `${mapping.id} drop precedence mismatch`).toBe(mapping.drop);
      }
    });

    it('should have correct CS class DSCP values per RFC 2474', () => {
      // CS DSCP = class * 8
      const csMappings = [
        { id: 'CS1', dscp: 8 },
        { id: 'CS2', dscp: 16 },
        { id: 'CS3', dscp: 24 },
        { id: 'CS4', dscp: 32 },
        { id: 'CS5', dscp: 40 },
        { id: 'CS6', dscp: 48 },
        { id: 'CS7', dscp: 56 },
      ];

      for (const mapping of csMappings) {
        const csClass = dscpClasses.classes.find(c => c.id === mapping.id);
        expect(csClass, `Missing CS class ${mapping.id}`).toBeDefined();
        expect(csClass.dscp, `${mapping.id} DSCP mismatch`).toBe(mapping.dscp);
      }
    });

    it('should have BE class with DSCP 0', () => {
      const beClass = dscpClasses.classes.find(c => c.id === 'BE');
      expect(beClass).toBeDefined();
      expect(beClass.dscp).toBe(0);
      expect(beClass.dscpBinary).toBe('000000');
    });
  });

  describe('Traffic to Service Class Mappings (RFC 4594 Table 3)', () => {
    // Get all decision/boss scenes with traffic info
    let trafficScenes;

    beforeAll(() => {
      trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );
    });

    it('should map telephony/VoIP to EF (RFC 4594 Section 4.7)', () => {
      const voipScenes = trafficScenes.filter(
        s => s.traffic.id.includes('voip') || s.traffic.name.toLowerCase().includes('voip')
      );

      expect(voipScenes.length).toBeGreaterThan(0);
      for (const scene of voipScenes) {
        expect(scene.traffic.correctClass, `VoIP traffic in "${scene.id}" should map to EF`).toBe(
          'EF'
        );
        expect(scene.traffic.rfcReference.section).toBe('4.1');
      }
    });

    it('should map real-time interactive (video) to AF41 (RFC 4594 Section 4.6)', () => {
      // Match video streams specifically, not voice conferences
      const videoScenes = trafficScenes.filter(
        s =>
          (s.traffic.id.includes('video') ||
            s.traffic.name.toLowerCase().includes('video stream') ||
            s.traffic.name.toLowerCase().includes('video conference') ||
            s.traffic.name.toLowerCase().includes('security camera')) &&
          !s.traffic.id.includes('voip') &&
          !s.traffic.name.toLowerCase().includes('call')
      );

      expect(videoScenes.length).toBeGreaterThan(0);
      for (const scene of videoScenes) {
        expect(
          scene.traffic.correctClass,
          `Video traffic in "${scene.id}" should map to AF41`
        ).toBe('AF41');
        expect(scene.traffic.rfcReference.section).toBe('4.4');
      }
    });

    it('should map high-throughput data (backup) to AF11 (RFC 4594 Section 4.8)', () => {
      const backupScenes = trafficScenes.filter(
        s =>
          s.traffic.id.includes('backup') ||
          s.traffic.id.includes('bulk') ||
          s.traffic.name.toLowerCase().includes('backup') ||
          s.traffic.name.toLowerCase().includes('replication')
      );

      expect(backupScenes.length).toBeGreaterThan(0);
      for (const scene of backupScenes) {
        expect(
          scene.traffic.correctClass,
          `Backup traffic in "${scene.id}" should map to AF11`
        ).toBe('AF11');
        expect(scene.traffic.rfcReference.section).toBe('4.8');
      }
    });

    it('should map standard traffic (email) to BE (RFC 4594 Section 4.12)', () => {
      const emailScenes = trafficScenes.filter(
        s =>
          s.traffic.id.includes('email') ||
          s.traffic.id.includes('standard') ||
          s.traffic.name.toLowerCase().includes('email') ||
          s.traffic.name.toLowerCase().includes('web traffic')
      );

      expect(emailScenes.length).toBeGreaterThan(0);
      for (const scene of emailScenes) {
        expect(
          scene.traffic.correctClass,
          `Email/standard traffic in "${scene.id}" should map to BE`
        ).toBe('BE');
        expect(scene.traffic.rfcReference.section).toBe('4.9');
      }
    });

    it('should map low-priority data (P2P/torrent) to CS1 (RFC 4594 Section 4.10)', () => {
      const lowPriorityScenes = trafficScenes.filter(
        s =>
          s.traffic.id.includes('flood') ||
          s.traffic.id.includes('torrent') ||
          s.traffic.id.includes('scavenger') ||
          s.traffic.name.toLowerCase().includes('p2p') ||
          s.traffic.name.toLowerCase().includes('torrent')
      );

      expect(lowPriorityScenes.length).toBeGreaterThan(0);
      for (const scene of lowPriorityScenes) {
        expect(
          scene.traffic.correctClass,
          `Low-priority traffic in "${scene.id}" should map to CS1`
        ).toBe('CS1');
        expect(scene.traffic.rfcReference.section).toBe('4.10');
      }
    });
  });

  describe('Correct Class Validation', () => {
    it('should have all correct classes defined in DSCP classes', () => {
      const validClassIds = new Set(dscpClasses.classes.map(c => c.id));
      const trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );

      for (const scene of trafficScenes) {
        expect(
          validClassIds.has(scene.traffic.correctClass),
          `Scene "${scene.id}" has invalid correctClass "${scene.traffic.correctClass}"`
        ).toBe(true);
      }
    });

    it('should have correct class within unlocked categories', () => {
      const trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );

      for (const scene of trafficScenes) {
        const correctClass = dscpClasses.classes.find(c => c.id === scene.traffic.correctClass);
        expect(
          scene.unlockedCategories.includes(correctClass.category),
          `Scene "${scene.id}": correct class ${correctClass.id} (category ${correctClass.category}) not in unlocked categories [${scene.unlockedCategories}]`
        ).toBe(true);
      }
    });
  });

  describe('RFC References', () => {
    it('should have RFC references for all traffic types', () => {
      const trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );

      for (const scene of trafficScenes) {
        expect(
          scene.traffic.rfcReference,
          `Scene "${scene.id}" missing RFC reference`
        ).toBeDefined();
        expect(scene.traffic.rfcReference.rfc).toBe(4594);
        expect(scene.traffic.rfcReference.section).toBeDefined();
      }
    });

    it('should have RFC references for all DSCP classes', () => {
      for (const cls of dscpClasses.classes) {
        expect(cls.rfcReference, `Class "${cls.id}" missing RFC reference`).toBeDefined();
        expect(cls.rfcReference.rfc).toBeDefined();
        expect(cls.rfcReference.section).toBeDefined();
      }
    });
  });

  describe('Game Coverage', () => {
    it('should cover all major service class categories', () => {
      const trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );
      const usedClasses = new Set(trafficScenes.map(s => s.traffic.correctClass));

      // Should have at least one example from each category
      const efUsed = [...usedClasses].some(c => c === 'EF');
      const afUsed = [...usedClasses].some(c => c.startsWith('AF'));
      const csUsed = [...usedClasses].some(c => c.startsWith('CS'));
      const beUsed = [...usedClasses].some(c => c === 'BE');

      expect(efUsed, 'Should have EF traffic example').toBe(true);
      expect(afUsed, 'Should have AF traffic example').toBe(true);
      expect(csUsed, 'Should have CS traffic example').toBe(true);
      expect(beUsed, 'Should have BE traffic example').toBe(true);
    });

    it('should have educational variety in traffic types', () => {
      const trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );
      const uniqueTrafficIds = new Set(trafficScenes.map(s => s.traffic.id));

      // Should have at least 5 different traffic types
      expect(uniqueTrafficIds.size).toBeGreaterThanOrEqual(5);
    });
  });
});
