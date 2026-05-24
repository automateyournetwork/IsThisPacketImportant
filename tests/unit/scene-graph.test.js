/**
 * Scene Graph Module Tests
 *
 * Tests state machine transitions and game flow logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSceneGraph, validateLevel } from '../../src/lib/scene-graph.js';

// Sample level data for testing
const mockLevel = {
  id: 'test-level',
  name: 'Test Level',
  metadata: { version: '1.0.0' },
  scenes: [
    {
      id: 'intro',
      type: 'intro',
      assets: { intro: 'intro.mp4' },
      next: { success: 'decision-01', failure: 'decision-01' },
    },
    {
      id: 'decision-01',
      type: 'decision',
      traffic: {
        id: 'voip',
        name: 'VoIP Call',
        correctClass: 'EF',
        rfcReference: { rfc: 4594, section: '4.7' },
      },
      timer: { duration: 5, type: 'standard' },
      assets: {
        intro: 'd01-intro.mp4',
        success: 'd01-success.mp4',
        failure: 'd01-failure.mp4',
      },
      unlockedCategories: ['EF', 'BE'],
      next: { success: 'decision-02', failure: 'decision-01-retry' },
    },
    {
      id: 'decision-01-retry',
      type: 'decision',
      traffic: {
        id: 'voip',
        name: 'VoIP Call',
        correctClass: 'EF',
        rfcReference: { rfc: 4594, section: '4.7' },
      },
      timer: { duration: 5, type: 'standard' },
      assets: { intro: 'd01-retry.mp4', success: 'd01-success.mp4', failure: 'd01-failure.mp4' },
      unlockedCategories: ['EF', 'BE'],
      next: { success: 'decision-02', failure: 'decision-01-retry' },
    },
    {
      id: 'decision-02',
      type: 'decision',
      traffic: {
        id: 'email',
        name: 'Email',
        correctClass: 'BE',
        rfcReference: { rfc: 4594, section: '4.12' },
      },
      timer: { duration: 5, type: 'standard' },
      assets: {
        intro: 'd02-intro.mp4',
        success: 'd02-success.mp4',
        failure: 'd02-failure.mp4',
      },
      unlockedCategories: ['EF', 'AF', 'BE'],
      next: { success: 'debrief', failure: 'decision-02' },
    },
    {
      id: 'debrief',
      type: 'debrief',
      assets: {},
      next: { success: 'end', failure: 'end' },
    },
  ],
};

describe('Scene Graph Module', () => {
  let sceneGraph;

  beforeEach(() => {
    sceneGraph = createSceneGraph(mockLevel);
  });

  describe('createSceneGraph', () => {
    it('should create scene graph from valid level', () => {
      expect(sceneGraph).toBeDefined();
      expect(sceneGraph.getState().state).toBe('idle');
    });

    it('should throw for invalid level data', () => {
      expect(() => createSceneGraph(null)).toThrow();
      expect(() => createSceneGraph({})).toThrow();
      expect(() => createSceneGraph({ scenes: 'not-array' })).toThrow();
    });
  });

  describe('start', () => {
    it('should transition to loading state', () => {
      sceneGraph.start();
      const state = sceneGraph.getState();
      expect(state.state).toBe('loading');
      expect(state.currentSceneId).toBe('intro');
    });
  });

  describe('ready', () => {
    it('should transition to cutscene for intro scene', () => {
      sceneGraph.start();
      sceneGraph.ready();
      expect(sceneGraph.getState().state).toBe('cutscene');
    });

    it('should transition to decision for decision scene', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      expect(sceneGraph.getState().state).toBe('decision');
    });

    it('should transition to debrief for debrief scene', () => {
      sceneGraph.start();
      sceneGraph.goToScene('debrief');
      sceneGraph.ready();
      expect(sceneGraph.getState().state).toBe('debrief');
    });
  });

  describe('cutsceneComplete', () => {
    it('should advance to next scene after cutscene', () => {
      sceneGraph.start();
      sceneGraph.ready(); // Now in cutscene state
      sceneGraph.cutsceneComplete();

      // Should have transitioned to loading for next scene
      const state = sceneGraph.getState();
      expect(state.state).toBe('loading');
      expect(state.currentSceneId).toBe('decision-01');
    });
  });

  describe('handleSuccess', () => {
    it('should record correct decision and transition', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();

      const result = sceneGraph.handleSuccess('EF', 3.5);

      expect(result.correct).toBe(true);
      expect(result.selectedClass).toBe('EF');
      expect(result.correctClass).toBe('EF');
      expect(result.timeRemaining).toBe(3.5);

      expect(sceneGraph.getState().state).toBe('transition');
    });

    it('should increment score for correct answer', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleSuccess('EF', 3);

      const finalScore = sceneGraph.getFinalScore();
      expect(finalScore.correct).toBe(1);
      expect(finalScore.score).toBe(100);
    });
  });

  describe('handleFailure', () => {
    it('should record incorrect decision and transition', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();

      const result = sceneGraph.handleFailure('BE', 2.0);

      expect(result.correct).toBe(false);
      expect(result.selectedClass).toBe('BE');
      expect(result.correctClass).toBe('EF');
    });

    it('should not increment score for wrong answer', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleFailure('BE', 2);

      const finalScore = sceneGraph.getFinalScore();
      expect(finalScore.correct).toBe(0);
      expect(finalScore.score).toBe(0);
    });
  });

  describe('handleTimeout', () => {
    it('should record timeout as incorrect', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();

      const result = sceneGraph.handleTimeout();

      expect(result.correct).toBe(false);
      expect(result.selectedClass).toBeNull();
      expect(result.timeRemaining).toBe(0);
    });
  });

  describe('advanceAfterTransition', () => {
    it('should go to success scene after correct answer', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleSuccess('EF', 3);
      sceneGraph.advanceAfterTransition(true);

      expect(sceneGraph.getState().currentSceneId).toBe('decision-02');
    });

    it('should go to failure scene after wrong answer', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleFailure('BE', 3);
      sceneGraph.advanceAfterTransition(false);

      expect(sceneGraph.getState().currentSceneId).toBe('decision-01-retry');
    });
  });

  describe('getDecisions', () => {
    it('should return all recorded decisions', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleSuccess('EF', 3);
      sceneGraph.advanceAfterTransition(true);
      sceneGraph.ready();
      sceneGraph.handleSuccess('BE', 4);

      const decisions = sceneGraph.getDecisions();
      expect(decisions).toHaveLength(2);
      expect(decisions[0].correct).toBe(true);
      expect(decisions[1].correct).toBe(true);
    });
  });

  describe('getFinalScore', () => {
    it('should calculate correct percentage', () => {
      sceneGraph.start();

      // First decision - correct
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleSuccess('EF', 3);
      sceneGraph.advanceAfterTransition(true);

      // Second decision - wrong
      sceneGraph.ready();
      sceneGraph.handleFailure('EF', 2); // Email should be BE
      sceneGraph.advanceAfterTransition(false);

      const score = sceneGraph.getFinalScore();
      expect(score.correct).toBe(1);
      expect(score.total).toBe(2);
      expect(score.percentage).toBe(50);
    });
  });

  describe('input locking', () => {
    it('should lock input after decision', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();

      expect(sceneGraph.isInputLocked()).toBe(false);

      sceneGraph.handleSuccess('EF', 3);

      expect(sceneGraph.isInputLocked()).toBe(true);
    });

    it('should unlock input when going to new scene', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleSuccess('EF', 3);
      sceneGraph.advanceAfterTransition(true);

      expect(sceneGraph.isInputLocked()).toBe(false);
    });
  });

  describe('state change callbacks', () => {
    it('should notify on state changes', () => {
      const callback = vi.fn();
      sceneGraph.onStateChange(callback);

      sceneGraph.start();

      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][1]).toBe('start');
    });

    it('should allow unsubscribing', () => {
      const callback = vi.fn();
      const unsubscribe = sceneGraph.onStateChange(callback);

      sceneGraph.start();
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();
      sceneGraph.goToScene('decision-01');
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      sceneGraph.start();
      sceneGraph.goToScene('decision-01');
      sceneGraph.ready();
      sceneGraph.handleSuccess('EF', 3);

      sceneGraph.reset();

      const state = sceneGraph.getState();
      expect(state.state).toBe('idle');
      expect(state.currentSceneId).toBeNull();
      expect(state.decisions).toHaveLength(0);
    });
  });
});

describe('validateLevel', () => {
  it('should return no errors for valid level', () => {
    const errors = validateLevel(mockLevel);
    expect(errors).toHaveLength(0);
  });

  it('should detect missing scenes array', () => {
    const errors = validateLevel({ id: 'test' });
    expect(errors.some(e => e.includes('scenes'))).toBe(true);
  });

  it('should detect empty scenes array', () => {
    const errors = validateLevel({ id: 'test', scenes: [] });
    expect(errors.some(e => e.includes('no scenes'))).toBe(true);
  });

  it('should detect duplicate scene IDs', () => {
    const level = {
      id: 'test',
      scenes: [
        { id: 'dup', type: 'intro', assets: {}, next: { success: 'end', failure: 'end' } },
        { id: 'dup', type: 'intro', assets: {}, next: { success: 'end', failure: 'end' } },
      ],
    };
    const errors = validateLevel(level);
    expect(errors.some(e => e.includes('Duplicate'))).toBe(true);
  });

  it('should detect missing traffic info in decision scenes', () => {
    const level = {
      id: 'test',
      scenes: [
        { id: 'dec', type: 'decision', assets: {}, next: { success: 'end', failure: 'end' } },
      ],
    };
    const errors = validateLevel(level);
    expect(errors.some(e => e.includes('traffic'))).toBe(true);
  });

  it('should detect references to unknown scenes', () => {
    const level = {
      id: 'test',
      scenes: [
        {
          id: 'intro',
          type: 'intro',
          assets: {},
          next: { success: 'nonexistent', failure: 'end' },
        },
      ],
    };
    const errors = validateLevel(level);
    expect(errors.some(e => e.includes('unknown'))).toBe(true);
  });
});
