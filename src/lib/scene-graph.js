/**
 * Scene Graph Module
 *
 * State machine for managing game flow.
 * Handles transitions between cutscenes, decisions, and debrief.
 *
 * @module scene-graph
 */

/**
 * @typedef {'idle' | 'loading' | 'cutscene' | 'decision' | 'boss' | 'transition' | 'debrief'} GameState
 */

/**
 * @typedef {Object} Scene
 * @property {string} id - Scene identifier
 * @property {string} type - Scene type (intro, decision, boss, debrief)
 * @property {Object} traffic - Traffic information
 * @property {Object} timer - Timer configuration
 * @property {Object} assets - Scene asset paths
 * @property {Object} next - Next scene mappings
 */

/**
 * @typedef {Object} DecisionResult
 * @property {string} sceneId - Scene where decision was made
 * @property {string} trafficId - Traffic type ID
 * @property {string} selectedClass - Player's selected class
 * @property {string} correctClass - Correct class
 * @property {boolean} correct - Whether selection was correct
 * @property {number} timeRemaining - Time remaining when selected
 * @property {number} timestamp - When decision was made
 */

/**
 * @typedef {Object} SceneGraphState
 * @property {GameState} state - Current game state
 * @property {string|null} currentSceneId - Current scene ID
 * @property {Scene|null} currentScene - Current scene data
 * @property {DecisionResult[]} decisions - Recorded decisions
 * @property {number} score - Current score
 * @property {number} totalDecisions - Total decisions made
 * @property {number} correctDecisions - Correct decisions made
 */

/**
 * @callback StateCallback
 * @param {SceneGraphState} state
 * @param {string} transition - Transition name that occurred
 */

/**
 * Create a scene graph instance
 * @param {Object} level - Level data from level-XX.json
 * @returns {Object} Scene graph control object
 */
export function createSceneGraph(level) {
  if (!level || !level.scenes || !Array.isArray(level.scenes)) {
    throw new Error('Invalid level data: scenes array required');
  }

  /** @type {Map<string, Scene>} Scene lookup by ID */
  const scenes = new Map();
  for (const scene of level.scenes) {
    scenes.set(scene.id, scene);
  }

  /** @type {GameState} */
  let state = 'idle';

  /** @type {string|null} */
  let currentSceneId = null;

  /** @type {DecisionResult[]} */
  const decisions = [];

  /** @type {Set<StateCallback>} */
  const stateCallbacks = new Set();

  /** @type {boolean} */
  let inputLocked = false;

  /**
   * Get the current scene object
   * @returns {Scene|null}
   */
  function getCurrentScene() {
    return currentSceneId ? scenes.get(currentSceneId) : null;
  }

  /**
   * Get full state snapshot
   * @returns {SceneGraphState}
   */
  function getState() {
    const correctCount = decisions.filter(d => d.correct).length;
    return {
      state,
      currentSceneId,
      currentScene: getCurrentScene(),
      decisions: [...decisions],
      score: correctCount * 100,
      totalDecisions: decisions.length,
      correctDecisions: correctCount,
    };
  }

  /**
   * Notify state change listeners
   * @param {string} transition
   */
  function notifyStateChange(transition) {
    const currentState = getState();
    for (const callback of stateCallbacks) {
      callback(currentState, transition);
    }
  }

  /**
   * Transition to a new state
   * @param {GameState} newState
   * @param {string} [sceneId]
   * @param {string} [transition]
   */
  function transitionTo(newState, sceneId, transition = 'transition') {
    const prevState = state;
    const prevScene = currentSceneId;

    state = newState;
    if (sceneId !== undefined) {
      currentSceneId = sceneId;
    }

    console.debug(
      `[SceneGraph] ${prevState}:${prevScene} -> ${newState}:${currentSceneId} (${transition})`
    );
    notifyStateChange(transition);
  }

  /**
   * Start the level from the beginning
   */
  function start() {
    if (level.scenes.length === 0) {
      throw new Error('Level has no scenes');
    }

    const firstScene = level.scenes[0];
    transitionTo('loading', firstScene.id, 'start');
  }

  /**
   * Called when assets are loaded and ready to play
   */
  function ready() {
    if (state !== 'loading') {
      console.warn('[SceneGraph] ready() called but not in loading state');
      return;
    }

    const scene = getCurrentScene();
    if (!scene) {
      throw new Error('No current scene');
    }

    // Determine state based on scene type
    switch (scene.type) {
      case 'intro':
        transitionTo('cutscene', currentSceneId, 'play-intro');
        break;
      case 'decision':
        transitionTo('decision', currentSceneId, 'show-decision');
        break;
      case 'boss':
        transitionTo('boss', currentSceneId, 'show-boss');
        break;
      case 'debrief':
        transitionTo('debrief', currentSceneId, 'show-debrief');
        break;
      default:
        transitionTo('cutscene', currentSceneId, 'play-scene');
    }
  }

  /**
   * Called when a cutscene finishes playing
   */
  function cutsceneComplete() {
    if (state !== 'cutscene') {
      console.warn('[SceneGraph] cutsceneComplete() called but not in cutscene state');
      return;
    }

    const scene = getCurrentScene();
    if (!scene) {
      return;
    }

    // Move to next scene (intro cutscenes always "succeed")
    const nextSceneId = scene.next?.success;
    if (nextSceneId) {
      goToScene(nextSceneId);
    }
  }

  /**
   * Record a player's decision
   * @param {string} selectedClass - The class selected by the player
   * @param {number} timeRemaining - Time remaining when selected
   * @returns {DecisionResult}
   */
  function recordDecision(selectedClass, timeRemaining) {
    if (state !== 'decision' && state !== 'boss') {
      throw new Error(`Cannot record decision in state: ${state}`);
    }

    const scene = getCurrentScene();
    if (!scene || !scene.traffic) {
      throw new Error('No traffic info in current scene');
    }

    const correct = selectedClass === scene.traffic.correctClass;

    const result = {
      sceneId: currentSceneId,
      trafficId: scene.traffic.id,
      selectedClass,
      correctClass: scene.traffic.correctClass,
      correct,
      timeRemaining,
      timestamp: Date.now(),
    };

    decisions.push(result);
    return result;
  }

  /**
   * Handle a successful decision
   * @param {string} selectedClass - The class selected
   * @param {number} timeRemaining - Time remaining
   */
  function handleSuccess(selectedClass, timeRemaining) {
    const result = recordDecision(selectedClass, timeRemaining);
    inputLocked = true;

    transitionTo('transition', currentSceneId, 'decision-success');

    return result;
  }

  /**
   * Handle a failed decision
   * @param {string} selectedClass - The class selected
   * @param {number} timeRemaining - Time remaining
   */
  function handleFailure(selectedClass, timeRemaining) {
    const result = recordDecision(selectedClass, timeRemaining);
    inputLocked = true;

    transitionTo('transition', currentSceneId, 'decision-failure');

    return result;
  }

  /**
   * Handle timeout (treat as failure)
   */
  function handleTimeout() {
    if (state !== 'decision' && state !== 'boss') {
      return;
    }

    const scene = getCurrentScene();
    if (!scene || !scene.traffic) {
      return;
    }

    // Record as incorrect with null selection
    const result = {
      sceneId: currentSceneId,
      trafficId: scene.traffic.id,
      selectedClass: null,
      correctClass: scene.traffic.correctClass,
      correct: false,
      timeRemaining: 0,
      timestamp: Date.now(),
    };

    decisions.push(result);
    inputLocked = true;

    transitionTo('transition', currentSceneId, 'decision-timeout');

    return result;
  }

  /**
   * Go to a specific scene
   * @param {string} sceneId - Target scene ID
   */
  function goToScene(sceneId) {
    if (!scenes.has(sceneId)) {
      if (sceneId === 'end') {
        // Level complete
        transitionTo('idle', null, 'level-complete');
        return;
      }
      throw new Error(`Unknown scene: ${sceneId}`);
    }

    inputLocked = false;
    transitionTo('loading', sceneId, 'go-to-scene');
  }

  /**
   * Advance to next scene after transition completes
   * @param {boolean} wasSuccess - Whether last decision was successful
   */
  function advanceAfterTransition(wasSuccess) {
    if (state !== 'transition') {
      console.warn('[SceneGraph] advanceAfterTransition() called but not in transition state');
      return;
    }

    const scene = getCurrentScene();
    if (!scene) {
      return;
    }

    const nextSceneId = wasSuccess ? scene.next.success : scene.next.failure || scene.next.timeout;

    if (nextSceneId) {
      goToScene(nextSceneId);
    }
  }

  /**
   * Get the next scene for success outcome
   * @returns {string|null}
   */
  function getSuccessScene() {
    const scene = getCurrentScene();
    return scene?.next?.success || null;
  }

  /**
   * Get the next scene for failure outcome
   * @returns {string|null}
   */
  function getFailureScene() {
    const scene = getCurrentScene();
    return scene?.next?.failure || scene?.next?.timeout || null;
  }

  /**
   * Check if input is currently locked
   * @returns {boolean}
   */
  function isInputLocked() {
    return inputLocked;
  }

  /**
   * Unlock input (after transition animation)
   */
  function unlockInput() {
    inputLocked = false;
  }

  /**
   * Lock input
   */
  function lockInput() {
    inputLocked = true;
  }

  /**
   * Get all decisions for debrief
   * @returns {DecisionResult[]}
   */
  function getDecisions() {
    return [...decisions];
  }

  /**
   * Get decision for a specific scene
   * @param {string} sceneId
   * @returns {DecisionResult|undefined}
   */
  function getDecisionForScene(sceneId) {
    return decisions.find(d => d.sceneId === sceneId);
  }

  /**
   * Calculate final score
   * @returns {Object}
   */
  function getFinalScore() {
    const correct = decisions.filter(d => d.correct).length;
    const total = decisions.length;
    const percentage = total > 0 ? (correct / total) * 100 : 0;

    return {
      correct,
      total,
      percentage: Math.round(percentage),
      score: correct * 100,
    };
  }

  /**
   * Reset the scene graph to initial state
   */
  function reset() {
    state = 'idle';
    currentSceneId = null;
    decisions.length = 0;
    inputLocked = false;
    notifyStateChange('reset');
  }

  /**
   * Register state change callback
   * @param {StateCallback} callback
   * @returns {Function} Unsubscribe function
   */
  function onStateChange(callback) {
    stateCallbacks.add(callback);
    return () => stateCallbacks.delete(callback);
  }

  /**
   * Get a scene by ID
   * @param {string} sceneId
   * @returns {Scene|undefined}
   */
  function getScene(sceneId) {
    return scenes.get(sceneId);
  }

  /**
   * Get all scenes
   * @returns {Scene[]}
   */
  function getAllScenes() {
    return Array.from(scenes.values());
  }

  /**
   * Get level metadata
   * @returns {Object}
   */
  function getLevelMetadata() {
    return level.metadata || {};
  }

  return {
    start,
    ready,
    cutsceneComplete,
    handleSuccess,
    handleFailure,
    handleTimeout,
    goToScene,
    advanceAfterTransition,
    getSuccessScene,
    getFailureScene,
    getState,
    getCurrentScene,
    getScene,
    getAllScenes,
    isInputLocked,
    unlockInput,
    lockInput,
    getDecisions,
    getDecisionForScene,
    getFinalScore,
    reset,
    onStateChange,
    getLevelMetadata,
  };
}

/**
 * Validate a level data structure
 * @param {Object} level
 * @returns {string[]} Array of validation errors
 */
export function validateLevel(level) {
  const errors = [];

  if (!level) {
    errors.push('Level data is null or undefined');
    return errors;
  }

  if (!level.id) {
    errors.push('Level missing id');
  }

  if (!level.scenes || !Array.isArray(level.scenes)) {
    errors.push('Level missing scenes array');
    return errors;
  }

  if (level.scenes.length === 0) {
    errors.push('Level has no scenes');
    return errors;
  }

  const sceneIds = new Set();
  for (const scene of level.scenes) {
    if (!scene.id) {
      errors.push('Scene missing id');
      continue;
    }

    if (sceneIds.has(scene.id)) {
      errors.push(`Duplicate scene id: ${scene.id}`);
    }
    sceneIds.add(scene.id);

    if (!scene.type) {
      errors.push(`Scene ${scene.id} missing type`);
    }

    if (!scene.next) {
      errors.push(`Scene ${scene.id} missing next`);
    } else {
      if (
        scene.next.success &&
        scene.next.success !== 'end' &&
        !level.scenes.some(s => s.id === scene.next.success)
      ) {
        errors.push(`Scene ${scene.id} references unknown success scene: ${scene.next.success}`);
      }
      if (
        scene.next.failure &&
        scene.next.failure !== 'end' &&
        !level.scenes.some(s => s.id === scene.next.failure)
      ) {
        errors.push(`Scene ${scene.id} references unknown failure scene: ${scene.next.failure}`);
      }
    }

    if ((scene.type === 'decision' || scene.type === 'boss') && !scene.traffic) {
      errors.push(`Decision/boss scene ${scene.id} missing traffic info`);
    }
  }

  return errors;
}
