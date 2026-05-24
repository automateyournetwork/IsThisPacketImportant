/**
 * Citation Verification Integration Tests
 *
 * Verifies all citations referenced in game content exist in citations.json
 * and that the cited RFC sections are valid.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

let levelData;
let citations;

beforeAll(async () => {
  const levelPath = path.join(PROJECT_ROOT, 'content', 'level-01.json');
  const citationsPath = path.join(PROJECT_ROOT, 'content', 'citations.json');

  const [levelContent, citationsContent] = await Promise.all([
    readFile(levelPath, 'utf-8'),
    readFile(citationsPath, 'utf-8'),
  ]);

  levelData = JSON.parse(levelContent);
  citations = JSON.parse(citationsContent);
});

describe('Citation Verification', () => {
  describe('Citations Manifest Structure', () => {
    it('should have valid version', () => {
      expect(citations.version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have lastUpdated timestamp', () => {
      expect(citations.lastUpdated).toBeDefined();
      expect(() => new Date(citations.lastUpdated)).not.toThrow();
    });

    it('should have citations array', () => {
      expect(Array.isArray(citations.citations)).toBe(true);
      expect(citations.citations.length).toBeGreaterThan(0);
    });
  });

  describe('Citation Entry Validation', () => {
    it('should have required fields for all citations', () => {
      const requiredFields = ['id', 'claim', 'rfc', 'section', 'title', 'url'];

      for (const citation of citations.citations) {
        for (const field of requiredFields) {
          expect(
            citation[field],
            `Citation "${citation.id}" missing field "${field}"`
          ).toBeDefined();
        }
      }
    });

    it('should have valid RFC numbers', () => {
      const validRfcs = [2474, 2475, 2597, 3246, 4594];

      for (const citation of citations.citations) {
        expect(
          validRfcs.includes(citation.rfc),
          `Citation "${citation.id}" has invalid RFC ${citation.rfc}`
        ).toBe(true);
      }
    });

    it('should have valid URL format', () => {
      for (const citation of citations.citations) {
        expect(
          citation.url.startsWith('https://www.rfc-editor.org/rfc/rfc'),
          `Citation "${citation.id}" has invalid URL format`
        ).toBe(true);
      }
    });

    it('should have unique citation IDs', () => {
      const ids = citations.citations.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });
  });

  describe('Scene Citation References', () => {
    it('should have all scene citations defined in manifest', () => {
      const citationIds = new Set(citations.citations.map(c => c.id));
      const scenesWithCitations = levelData.scenes.filter(s => s.citations);

      for (const scene of scenesWithCitations) {
        for (const citationId of scene.citations) {
          expect(
            citationIds.has(citationId),
            `Scene "${scene.id}" references undefined citation "${citationId}"`
          ).toBe(true);
        }
      }
    });

    it('should have all firstUseTerms citations defined in manifest', () => {
      const citationIds = new Set(citations.citations.map(c => c.id));
      const scenesWithTerms = levelData.scenes.filter(s => s.firstUseTerms);

      for (const scene of scenesWithTerms) {
        for (const term of scene.firstUseTerms) {
          if (term.citation) {
            expect(
              citationIds.has(term.citation),
              `Term "${term.term}" in scene "${scene.id}" references undefined citation "${term.citation}"`
            ).toBe(true);
          }
        }
      }
    });
  });

  describe('Citation Coverage', () => {
    it('should have citations for all PHB categories', () => {
      const citationClaims = citations.citations.map(c => c.claim.toLowerCase());

      expect(
        citationClaims.some(c => c.includes('expedited forwarding') || c.includes('ef')),
        'Missing EF citation'
      ).toBe(true);

      expect(
        citationClaims.some(c => c.includes('assured forwarding') || c.includes('af')),
        'Missing AF citation'
      ).toBe(true);

      expect(
        citationClaims.some(c => c.includes('class selector') || c.includes('cs')),
        'Missing CS citation'
      ).toBe(true);

      expect(
        citationClaims.some(
          c => c.includes('best effort') || c.includes('be') || c.includes('default')
        ),
        'Missing BE citation'
      ).toBe(true);
    });

    it('should cover key RFC 4594 service classes', () => {
      const sections = citations.citations.filter(c => c.rfc === 4594).map(c => c.section);

      // Key sections from RFC 4594
      const requiredSections = ['4.1', '4.4', '4.8', '4.9', '4.10'];

      for (const section of requiredSections) {
        expect(sections.includes(section), `Missing citation for RFC 4594 Section ${section}`).toBe(
          true
        );
      }
    });
  });

  describe('RFC Reference Consistency', () => {
    it('should match traffic RFC references to citations', () => {
      const trafficScenes = levelData.scenes.filter(
        s => (s.type === 'decision' || s.type === 'boss') && s.traffic
      );

      for (const scene of trafficScenes) {
        if (scene.citations && scene.citations.length > 0) {
          const sceneCitation = citations.citations.find(
            c => scene.citations.includes(c.id) && c.rfc === 4594
          );

          if (sceneCitation) {
            expect(sceneCitation.section, `Scene "${scene.id}" citation section mismatch`).toBe(
              scene.traffic.rfcReference.section
            );
          }
        }
      }
    });
  });
});

describe('Citation RFC Mapping', () => {
  describe('RFC 4594 Service Class Coverage', () => {
    const rfc4594Citations = () => citations.citations.filter(c => c.rfc === 4594);

    it('should cover Telephony Service Class (Section 4.1)', () => {
      const telephonyCitations = rfc4594Citations().filter(c => c.section === '4.1');
      expect(telephonyCitations.length).toBeGreaterThan(0);
      expect(
        telephonyCitations.some(
          c => c.claim.toLowerCase().includes('voip') || c.claim.toLowerCase().includes('telephony')
        )
      ).toBe(true);
    });

    it('should cover Real-Time Interactive Service Class (Section 4.4)', () => {
      const videoConfCitations = rfc4594Citations().filter(c => c.section === '4.4');
      expect(videoConfCitations.length).toBeGreaterThan(0);
      expect(
        videoConfCitations.some(
          c =>
            c.claim.toLowerCase().includes('video') || c.claim.toLowerCase().includes('interactive')
        )
      ).toBe(true);
    });

    it('should cover High-Throughput Data Service Class (Section 4.8)', () => {
      const bulkDataCitations = rfc4594Citations().filter(c => c.section === '4.8');
      expect(bulkDataCitations.length).toBeGreaterThan(0);
      expect(
        bulkDataCitations.some(
          c =>
            c.claim.toLowerCase().includes('throughput') ||
            c.claim.toLowerCase().includes('bulk') ||
            c.claim.toLowerCase().includes('backup')
        )
      ).toBe(true);
    });

    it('should cover Low-Priority Data Service Class (Section 4.10)', () => {
      const scavengerCitations = rfc4594Citations().filter(c => c.section === '4.10');
      expect(scavengerCitations.length).toBeGreaterThan(0);
      expect(
        scavengerCitations.some(
          c =>
            c.claim.toLowerCase().includes('low-priority') ||
            c.claim.toLowerCase().includes('scavenger') ||
            c.claim.toLowerCase().includes('p2p')
        )
      ).toBe(true);
    });

    it('should cover Standard Service Class (Section 4.9)', () => {
      const standardCitations = rfc4594Citations().filter(c => c.section === '4.9');
      expect(standardCitations.length).toBeGreaterThan(0);
      expect(
        standardCitations.some(
          c =>
            c.claim.toLowerCase().includes('standard') ||
            c.claim.toLowerCase().includes('email') ||
            c.claim.toLowerCase().includes('best effort')
        )
      ).toBe(true);
    });
  });

  describe('Supporting RFC Coverage', () => {
    it('should have RFC 2474 citations for DSCP definition', () => {
      const dscpCitations = citations.citations.filter(c => c.rfc === 2474);
      expect(dscpCitations.length).toBeGreaterThan(0);
    });

    it('should have RFC 2597 citations for AF definition', () => {
      const afCitations = citations.citations.filter(c => c.rfc === 2597);
      expect(afCitations.length).toBeGreaterThan(0);
    });

    it('should have RFC 3246 citations for EF definition', () => {
      const efCitations = citations.citations.filter(c => c.rfc === 3246);
      expect(efCitations.length).toBeGreaterThan(0);
    });
  });
});
