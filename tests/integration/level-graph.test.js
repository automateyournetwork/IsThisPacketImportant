/**
 * Level Graph Integration Tests
 *
 * Verifies all scenes in level-01.json are reachable and properly connected.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../..');

let levelData;

beforeAll(async () => {
  const levelPath = path.join(PROJECT_ROOT, 'content', 'level-01.json');
  const content = await readFile(levelPath, 'utf-8');
  levelData = JSON.parse(content);
});

describe('Level Graph - level-01.json', () => {
  describe('Structure Validation', () => {
    it('should have required top-level properties', () => {
      expect(levelData.id).toBe('rush-hour-router-7');
      expect(levelData.name).toBeDefined();
      expect(levelData.scenes).toBeInstanceOf(Array);
      expect(levelData.metadata).toBeDefined();
    });

    it('should have at least one scene', () => {
      expect(levelData.scenes.length).toBeGreaterThan(0);
    });

    it('should have unique scene IDs', () => {
      const ids = levelData.scenes.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Scene Reachability', () => {
    it('should have all scenes reachable from intro', () => {
      const reachable = new Set();
      const queue = ['intro'];

      while (queue.length > 0) {
        const sceneId = queue.shift();
        if (reachable.has(sceneId) || sceneId === 'end') {
          continue;
        }

        reachable.add(sceneId);
        const scene = levelData.scenes.find(s => s.id === sceneId);

        if (scene?.next) {
          if (scene.next.success && !reachable.has(scene.next.success)) {
            queue.push(scene.next.success);
          }
          if (scene.next.failure && !reachable.has(scene.next.failure)) {
            queue.push(scene.next.failure);
          }
          if (scene.next.timeout && !reachable.has(scene.next.timeout)) {
            queue.push(scene.next.timeout);
          }
        }
      }

      // All scenes should be reachable
      const allSceneIds = new Set(levelData.scenes.map(s => s.id));
      for (const id of allSceneIds) {
        expect(reachable.has(id), `Scene "${id}" should be reachable`).toBe(true);
      }
    });

    it('should have valid next scene references', () => {
      const validIds = new Set(levelData.scenes.map(s => s.id));
      validIds.add('end'); // 'end' is a valid terminal reference

      for (const scene of levelData.scenes) {
        if (scene.next) {
          if (scene.next.success) {
            expect(
              validIds.has(scene.next.success),
              `Scene "${scene.id}" references invalid success scene "${scene.next.success}"`
            ).toBe(true);
          }
          if (scene.next.failure) {
            expect(
              validIds.has(scene.next.failure),
              `Scene "${scene.id}" references invalid failure scene "${scene.next.failure}"`
            ).toBe(true);
          }
          if (scene.next.timeout) {
            expect(
              validIds.has(scene.next.timeout),
              `Scene "${scene.id}" references invalid timeout scene "${scene.next.timeout}"`
            ).toBe(true);
          }
        }
      }
    });
  });

  describe('Scene Types', () => {
    it('should start with an intro scene', () => {
      const firstScene = levelData.scenes[0];
      expect(firstScene.type).toBe('intro');
    });

    it('should have decision scenes with traffic info', () => {
      const decisionScenes = levelData.scenes.filter(s => s.type === 'decision');
      expect(decisionScenes.length).toBeGreaterThan(0);

      for (const scene of decisionScenes) {
        expect(scene.traffic, `Decision scene "${scene.id}" missing traffic`).toBeDefined();
        expect(
          scene.traffic.correctClass,
          `Decision scene "${scene.id}" missing correctClass`
        ).toBeDefined();
        expect(scene.timer, `Decision scene "${scene.id}" missing timer`).toBeDefined();
      }
    });

    it('should have boss scenes with traffic info', () => {
      const bossScenes = levelData.scenes.filter(s => s.type === 'boss');
      expect(bossScenes.length).toBeGreaterThan(0);

      for (const scene of bossScenes) {
        expect(scene.traffic, `Boss scene "${scene.id}" missing traffic`).toBeDefined();
        expect(scene.timer.type).toBe('boss');
        expect(scene.timer.duration).toBe(3); // Boss timer is 3 seconds
      }
    });

    it('should have exactly one debrief scene', () => {
      const debriefScenes = levelData.scenes.filter(s => s.type === 'debrief');
      expect(debriefScenes.length).toBe(1);
    });

    it('should end with debrief leading to end', () => {
      const debriefScene = levelData.scenes.find(s => s.type === 'debrief');
      expect(debriefScene.next.success).toBe('end');
      expect(debriefScene.next.failure).toBe('end');
    });
  });

  describe('Vignette Structure', () => {
    it('should have 5 main vignettes plus boss event', () => {
      // Main vignettes are decision scenes that aren't retries
      const mainVignettes = levelData.scenes.filter(
        s => s.type === 'decision' && !s.id.includes('retry') && !s.id.includes('fail')
      );
      expect(mainVignettes.length).toBe(5);
    });

    it('should have 5 boss packets', () => {
      const bossScenes = levelData.scenes.filter(s => s.type === 'boss');
      expect(bossScenes.length).toBe(5);
    });

    it('should have retry paths for failed decisions', () => {
      // Each main vignette should have a retry/fail path
      const mainVignettes = levelData.scenes.filter(
        s => s.type === 'decision' && !s.id.includes('retry') && !s.id.includes('fail')
      );

      for (const vignette of mainVignettes) {
        const failureScene = vignette.next.failure;
        expect(failureScene, `Vignette "${vignette.id}" missing failure path`).toBeDefined();
      }
    });
  });

  describe('Timer Configuration', () => {
    it('should have tutorial timer (8s) for first vignette', () => {
      const firstDecision = levelData.scenes.find(s => s.id === 'vignette-01');
      expect(firstDecision.timer.duration).toBe(8);
      expect(firstDecision.timer.type).toBe('tutorial');
    });

    it('should have standard timer (5s) for regular vignettes', () => {
      const standardScenes = levelData.scenes.filter(
        s => s.type === 'decision' && s.timer?.type === 'standard'
      );
      for (const scene of standardScenes) {
        expect(scene.timer.duration).toBe(5);
      }
    });

    it('should have boss timer (3s) for boss event', () => {
      const bossScenes = levelData.scenes.filter(s => s.type === 'boss');
      for (const scene of bossScenes) {
        expect(scene.timer.duration).toBe(3);
        expect(scene.timer.type).toBe('boss');
      }
    });
  });

  describe('Progressive Unlock', () => {
    it('should start with limited categories (EF, BE)', () => {
      const firstDecision = levelData.scenes.find(s => s.id === 'vignette-01');
      expect(firstDecision.unlockedCategories).toContain('EF');
      expect(firstDecision.unlockedCategories).toContain('BE');
      expect(firstDecision.unlockedCategories).not.toContain('AF');
      expect(firstDecision.unlockedCategories).not.toContain('CS');
    });

    it('should unlock AF category by vignette 2', () => {
      const vignette2 = levelData.scenes.find(s => s.id === 'vignette-02');
      expect(vignette2.unlockedCategories).toContain('AF');
    });

    it('should have all categories unlocked by vignette 4', () => {
      const vignette4 = levelData.scenes.find(s => s.id === 'vignette-04');
      expect(vignette4.unlockedCategories).toContain('EF');
      expect(vignette4.unlockedCategories).toContain('AF');
      expect(vignette4.unlockedCategories).toContain('CS');
      expect(vignette4.unlockedCategories).toContain('BE');
    });

    it('should have all categories for boss event', () => {
      const bossScenes = levelData.scenes.filter(s => s.type === 'boss');
      for (const scene of bossScenes) {
        expect(scene.unlockedCategories).toContain('EF');
        expect(scene.unlockedCategories).toContain('AF');
        expect(scene.unlockedCategories).toContain('CS');
        expect(scene.unlockedCategories).toContain('BE');
      }
    });
  });

  describe('Asset References', () => {
    it('should have video assets for all scenes with cutscenes', () => {
      const scenesWithVideos = levelData.scenes.filter(
        s => s.type === 'intro' || s.type === 'decision' || s.type === 'boss'
      );

      for (const scene of scenesWithVideos) {
        if (scene.type === 'intro') {
          expect(
            scene.assets?.intro,
            `Intro scene "${scene.id}" missing intro video`
          ).toBeDefined();
        } else {
          expect(scene.assets?.intro, `Scene "${scene.id}" missing intro video`).toBeDefined();
          expect(scene.assets?.success, `Scene "${scene.id}" missing success video`).toBeDefined();
          expect(scene.assets?.failure, `Scene "${scene.id}" missing failure video`).toBeDefined();
        }
      }
    });

    it('should have valid video path format', () => {
      const videoPaths = [];
      for (const scene of levelData.scenes) {
        if (scene.assets) {
          if (scene.assets.intro) {
            videoPaths.push(scene.assets.intro);
          }
          if (scene.assets.success) {
            videoPaths.push(scene.assets.success);
          }
          if (scene.assets.failure) {
            videoPaths.push(scene.assets.failure);
          }
        }
      }

      for (const path of videoPaths) {
        expect(path).toMatch(/^cutscenes\/.*\.mp4$/);
      }
    });
  });
});
