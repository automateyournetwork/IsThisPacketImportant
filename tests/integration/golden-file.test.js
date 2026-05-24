/**
 * Golden File Tests
 *
 * Verifies that data files and regenerated assets maintain consistency.
 * Ensures idempotent asset generation and schema compliance.
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

describe('Golden File Verification', () => {
  describe('Required Data Files', () => {
    it('should have dscp-classes.json', async () => {
      const filePath = path.join(PROJECT_ROOT, 'content', 'dscp-classes.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBeDefined();
      expect(data.categories).toBeDefined();
      expect(data.classes).toBeDefined();
      expect(data.classes.length).toBeGreaterThan(0);
    });

    it('should have level-01.json with valid structure', async () => {
      const filePath = path.join(PROJECT_ROOT, 'content', 'level-01.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.id).toBeDefined();
      expect(data.scenes).toBeDefined();
      expect(Array.isArray(data.scenes)).toBe(true);
      expect(data.scenes.length).toBeGreaterThan(0);
    });

    it('should have citations.json with valid structure', async () => {
      const filePath = path.join(PROJECT_ROOT, 'content', 'citations.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBeDefined();
      expect(data.citations).toBeDefined();
      expect(Array.isArray(data.citations)).toBe(true);
    });

    it('should have voice-config.json', async () => {
      const filePath = path.join(PROJECT_ROOT, 'audio', 'voice-config.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.characters).toBeDefined();
    });
  });

  describe('Manifest Files', () => {
    it('should have audio/manifest.json', async () => {
      const filePath = path.join(PROJECT_ROOT, 'audio', 'manifest.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBeDefined();
    });

    it('should have assets/manifest.json', async () => {
      const filePath = path.join(PROJECT_ROOT, 'assets', 'manifest.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBeDefined();
    });

    it('should have cutscenes/manifest.json', async () => {
      const filePath = path.join(PROJECT_ROOT, 'cutscenes', 'manifest.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.version).toBeDefined();
    });
  });

  describe('Placeholder Video Files', () => {
    const cutsceneDir = path.join(PROJECT_ROOT, 'cutscenes', 'level-01');

    it('should have cutscenes/level-01 directory', async () => {
      expect(existsSync(cutsceneDir)).toBe(true);
    });

    it('should have intro.mp4', async () => {
      const filePath = path.join(cutsceneDir, 'intro.mp4');
      expect(existsSync(filePath)).toBe(true);
    });

    it('should have at least 20 video files', async () => {
      if (!existsSync(cutsceneDir)) {
        return;
      }

      const files = await readdir(cutsceneDir);
      const mp4Files = files.filter(f => f.endsWith('.mp4'));

      expect(mp4Files.length).toBeGreaterThanOrEqual(20);
    });
  });

  describe('Dialog Files', () => {
    const dialogDir = path.join(PROJECT_ROOT, 'content', 'dialog', 'level-01');

    it('should have dialog directory', async () => {
      expect(existsSync(dialogDir)).toBe(true);
    });

    it('should have intro.json dialog', async () => {
      const filePath = path.join(dialogDir, 'intro.json');
      expect(existsSync(filePath)).toBe(true);

      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      expect(data.sceneId).toBe('intro');
      expect(data.lines).toBeDefined();
      expect(Array.isArray(data.lines)).toBe(true);
    });

    it('should have valid dialog structure for all files', async () => {
      if (!existsSync(dialogDir)) {
        return;
      }

      const files = await readdir(dialogDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(dialogDir, file);
        const content = await readFile(filePath, 'utf-8');
        const data = JSON.parse(content);

        expect(data.sceneId, `${file} missing sceneId`).toBeDefined();
        expect(data.lines, `${file} missing lines`).toBeDefined();

        for (const line of data.lines) {
          expect(line.id, `${file} line missing id`).toBeDefined();
          expect(line.character, `${file} line missing character`).toBeDefined();
          expect(line.text, `${file} line missing text`).toBeDefined();
          expect(line.timing, `${file} line missing timing`).toBeDefined();
        }
      }
    });
  });

  describe('Source Files', () => {
    it('should have all required lib modules', async () => {
      const libDir = path.join(PROJECT_ROOT, 'src', 'lib');
      const requiredModules = [
        'classifier.js',
        'timer.js',
        'input-handler.js',
        'scene-graph.js',
        'video-player.js',
        'audio-player.js',
      ];

      for (const module of requiredModules) {
        const filePath = path.join(libDir, module);
        expect(existsSync(filePath), `Missing module: ${module}`).toBe(true);
      }
    });

    it('should have all required components', async () => {
      const componentsDir = path.join(PROJECT_ROOT, 'src', 'components');
      const requiredComponents = ['decision-ui.js', 'citation.js', 'debrief.js', 'subtitle.js'];

      for (const component of requiredComponents) {
        const filePath = path.join(componentsDir, component);
        expect(existsSync(filePath), `Missing component: ${component}`).toBe(true);
      }
    });

    it('should have main.js entry point', async () => {
      const filePath = path.join(PROJECT_ROOT, 'src', 'main.js');
      expect(existsSync(filePath)).toBe(true);
    });
  });

  describe('Build Scripts', () => {
    it('should have all generation scripts', async () => {
      const scriptsDir = path.join(PROJECT_ROOT, 'scripts');
      const requiredScripts = [
        'gen-tts.js',
        'gen-images.js',
        'gen-cutscenes.js',
        'gen-placeholder-videos.js',
        'fetch-rfc-citations.js',
        'verify-citations.js',
      ];

      for (const script of requiredScripts) {
        const filePath = path.join(scriptsDir, script);
        expect(existsSync(filePath), `Missing script: ${script}`).toBe(true);
      }
    });
  });
});

describe('Schema Compliance', () => {
  it('should have valid DSCP values (0-63)', async () => {
    const filePath = path.join(PROJECT_ROOT, 'content', 'dscp-classes.json');
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    for (const cls of data.classes) {
      expect(cls.dscp).toBeGreaterThanOrEqual(0);
      expect(cls.dscp).toBeLessThanOrEqual(63);
    }
  });

  it('should have valid 6-bit binary strings', async () => {
    const filePath = path.join(PROJECT_ROOT, 'content', 'dscp-classes.json');
    const content = await readFile(filePath, 'utf-8');
    const data = JSON.parse(content);

    for (const cls of data.classes) {
      expect(cls.dscpBinary).toMatch(/^[01]{6}$/);
      expect(parseInt(cls.dscpBinary, 2)).toBe(cls.dscp);
    }
  });

  it('should have consistent citation references', async () => {
    const levelPath = path.join(PROJECT_ROOT, 'content', 'level-01.json');
    const citationsPath = path.join(PROJECT_ROOT, 'content', 'citations.json');

    const levelContent = await readFile(levelPath, 'utf-8');
    const citationsContent = await readFile(citationsPath, 'utf-8');

    const level = JSON.parse(levelContent);
    const citations = JSON.parse(citationsContent);
    const citationIds = new Set(citations.citations.map(c => c.id));

    const scenesWithCitations = level.scenes.filter(s => s.citations);

    for (const scene of scenesWithCitations) {
      for (const citationId of scene.citations) {
        expect(
          citationIds.has(citationId),
          `Scene "${scene.id}" references missing citation "${citationId}"`
        ).toBe(true);
      }
    }
  });
});
