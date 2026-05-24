/**
 * Main Game Entry Point
 *
 * Bootstraps the game, loads level data, and manages the game loop.
 * Wires together scene-graph, decision-ui, video-player, and input handling.
 *
 * @module main
 */

import {
  loadGameData,
  preloadCriticalAssets,
  resolveAssetPath,
  lazyLoadUpcomingAssets,
} from './data/loader.js';
import { initClassifier } from './lib/classifier.js';
import { createSceneGraph } from './lib/scene-graph.js';
import { createVideoPlayer } from './lib/video-player.js';
import { createAudioPlayer } from './lib/audio-player.js';
import { createInputHandler } from './lib/input-handler.js';
import { createDecisionUI } from './components/decision-ui.js';
import { createCitationComponent, loadCitations } from './components/citation.js';
import { createDebriefComponent } from './components/debrief.js';

/**
 * @typedef {Object} GameState
 * @property {boolean} isLoading - Whether game is loading
 * @property {boolean} isPlaying - Whether game is actively playing
 * @property {boolean} isPaused - Whether game is paused
 */

// Game instance
let game = null;

/**
 * Create the game instance
 * @returns {Object} Game control object
 */
function createGame() {
  // Core systems
  let sceneGraph = null;
  let videoPlayer = null;
  let audioPlayer = null;
  let inputHandler = null;
  let decisionUI = null;
  let citationComponent = null;
  let debriefComponent = null;

  // Data
  let gameData = null;
  let citationsData = [];

  // State
  let isLoading = true;
  let isPlaying = false;
  let isPaused = false;

  // DOM elements
  const loadingScreen = document.getElementById('loading-screen');
  const loadingProgress = document.querySelector('.loading-progress');
  const videoElement = document.getElementById('cutscene-player');
  const uiLayer = document.getElementById('ui-layer');

  /**
   * Update loading progress
   * @param {number} percent
   */
  function updateLoadingProgress(percent) {
    if (loadingProgress) {
      loadingProgress.style.width = `${percent}%`;
    }
  }

  /**
   * Hide loading screen
   */
  function hideLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.classList.add('hidden');
    }
  }

  /**
   * Initialize the game
   */
  async function init() {
    console.log('[Game] Initializing...');
    isLoading = true;
    updateLoadingProgress(10);

    try {
      // Load game data
      console.log('[Game] Loading game data...');
      gameData = await loadGameData('level-01');
      updateLoadingProgress(40);

      // Initialize classifier with DSCP data
      initClassifier(gameData.dscpClasses);
      updateLoadingProgress(50);

      // Create scene graph
      sceneGraph = createSceneGraph(gameData.level);
      updateLoadingProgress(60);

      // Create video player
      videoPlayer = createVideoPlayer(videoElement);
      updateLoadingProgress(70);

      // Create audio player
      audioPlayer = createAudioPlayer();
      updateLoadingProgress(75);

      // Create input handler
      inputHandler = createInputHandler();
      updateLoadingProgress(80);

      // Create decision UI
      decisionUI = createDecisionUI({
        container: uiLayer,
        dscpClasses: gameData.dscpClasses,
        onSelect: handleClassSelection,
        onTimeout: handleTimeout,
      });
      updateLoadingProgress(82);

      // Load and create citation component
      console.log('[Game] Loading citations...');
      try {
        citationsData = await loadCitations('/content/citations.json');
        citationComponent = createCitationComponent({
          container: uiLayer,
          citations: citationsData,
          showByDefault: false,
          onCitationClick: citationId => {
            console.log('[Game] Citation clicked:', citationId);
          },
        });
      } catch (err) {
        console.warn('[Game] Failed to load citations:', err.message);
        // Continue without citations
      }
      updateLoadingProgress(83);

      // Create debrief component
      debriefComponent = createDebriefComponent({
        container: uiLayer,
        dscpClasses: gameData.dscpClasses,
        level: gameData.level,
        citations: citationsData,
        onReplay: () => {
          location.reload();
        },
      });
      updateLoadingProgress(85);

      // Wire up systems
      wireUpSystems();
      updateLoadingProgress(90);

      // Preload critical assets
      console.log('[Game] Preloading critical assets...');
      await preloadCriticalAssets(gameData.level, {
        onProgress: (loaded, total) => {
          const preloadPercent = 90 + (loaded / total) * 10;
          updateLoadingProgress(preloadPercent);
        },
      });

      updateLoadingProgress(100);
      console.log('[Game] Initialization complete');

      isLoading = false;
    } catch (err) {
      console.error('[Game] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Wire up all game systems
   */
  function wireUpSystems() {
    // Scene graph state changes
    sceneGraph.onStateChange(handleSceneStateChange);

    // Video player end events
    videoPlayer.onEnd(handleVideoEnd);

    // Input handler events
    inputHandler.onInput(handleInput);
  }

  /**
   * Handle scene graph state changes
   * @param {Object} state
   * @param {string} transition
   */
  function handleSceneStateChange(state, transition) {
    console.log(`[Game] State change: ${state.state} (${transition})`);

    switch (state.state) {
      case 'loading':
        handleLoadingState(state);
        break;
      case 'cutscene':
        handleCutsceneState(state);
        break;
      case 'decision':
      case 'boss':
        handleDecisionState(state);
        break;
      case 'transition':
        handleTransitionState(state, transition);
        break;
      case 'debrief':
        handleDebriefState(state);
        break;
      case 'idle':
        if (transition === 'level-complete') {
          handleLevelComplete(state);
        }
        break;
    }
  }

  /**
   * Handle loading state - preload scene assets
   * @param {Object} state
   */
  async function handleLoadingState(state) {
    const scene = state.currentScene;
    if (!scene) {
      return;
    }

    // Lock input during loading
    inputHandler.lock();

    // Preload scene video if available
    if (scene.assets?.intro) {
      try {
        await videoPlayer.load(resolveAssetPath(scene.assets.intro));
      } catch (err) {
        console.warn(`Failed to load intro video: ${err.message}`);
      }
    }

    // Lazy-load upcoming scene assets in background
    lazyLoadUpcomingAssets(gameData.level, scene.id, 2).catch(() => {});

    // Signal ready to advance
    sceneGraph.ready();
  }

  /**
   * Handle cutscene state - play video
   * @param {Object} state
   */
  async function handleCutsceneState(state) {
    const scene = state.currentScene;
    if (!scene) {
      return;
    }

    // Hide decision UI
    decisionUI.hide();

    // Clear citations during cutscenes
    if (citationComponent) {
      citationComponent.clearCitations();
    }

    // Unlock input (for skip functionality in future)
    inputHandler.unlock();

    // Play intro video
    if (scene.assets?.intro) {
      try {
        await videoPlayer.play();
      } catch (err) {
        console.warn(`Failed to play video: ${err.message}`);
        // Auto-advance on video failure
        sceneGraph.cutsceneComplete();
      }
    } else {
      // No video, auto-advance
      sceneGraph.cutsceneComplete();
    }
  }

  /**
   * Handle decision/boss state - show decision UI
   * @param {Object} state
   */
  async function handleDecisionState(state) {
    const scene = state.currentScene;
    if (!scene) {
      return;
    }

    // Play intro video for this decision
    if (scene.assets?.intro) {
      videoPlayer.load(resolveAssetPath(scene.assets.intro)).then(() => {
        videoPlayer.play().catch(() => {});
      });
    }

    // Show first-use terms before starting timer
    if (citationComponent && scene.firstUseTerms && scene.firstUseTerms.length > 0) {
      // Pause video during term intro
      videoPlayer.pause();
      await citationComponent.showTermIntros(scene.firstUseTerms);
      // Resume video
      videoPlayer.play().catch(() => {});
    }

    // Update citations for this scene
    if (citationComponent && scene.citations) {
      citationComponent.showCitations(scene.citations);
    }

    // Unlock input
    inputHandler.unlock();

    // Show decision UI
    decisionUI.show(scene);
  }

  /**
   * Handle transition state - play success/failure video
   * @param {Object} state
   * @param {string} transition
   */
  async function handleTransitionState(state, transition) {
    const scene = state.currentScene;
    if (!scene) {
      return;
    }

    // Lock input during transition
    inputHandler.lock();

    // Hide decision UI
    decisionUI.hide();

    // Determine which video to play
    const isSuccess = transition === 'decision-success' || transition === 'boss-success';
    const videoPath = isSuccess ? scene.assets?.success : scene.assets?.failure;

    if (videoPath) {
      try {
        await videoPlayer.load(resolveAssetPath(videoPath));
        await videoPlayer.play();
        // Video end will trigger advance
      } catch (err) {
        console.warn(`Failed to play transition video: ${err.message}`);
        // Auto-advance on failure
        sceneGraph.advanceAfterTransition(isSuccess);
      }
    } else {
      // No video, auto-advance
      setTimeout(() => {
        sceneGraph.advanceAfterTransition(isSuccess);
      }, 500);
    }
  }

  /**
   * Handle debrief state - show results
   * @param {Object} _state - Unused but required by handler signature
   */
  function handleDebriefState(_state) {
    // Hide decision UI
    decisionUI.hide();

    // Clear citations
    if (citationComponent) {
      citationComponent.clearCitations();
    }

    // Get decisions and show debrief
    const decisions = sceneGraph.getDecisions();

    if (debriefComponent) {
      debriefComponent.show(decisions);
    } else {
      // Fallback to legacy debrief screen
      const debriefScreen = document.getElementById('debrief-screen');
      if (debriefScreen) {
        debriefScreen.classList.remove('hidden');
        renderLegacyDebrief(decisions);
      }
    }

    // Unlock input for navigation
    inputHandler.unlock();
  }

  /**
   * Legacy debrief rendering (fallback)
   * @param {DecisionResult[]} decisions
   */
  function renderLegacyDebrief(decisions) {
    const debriefScreen = document.getElementById('debrief-screen');
    if (!debriefScreen) {
      return;
    }

    const score = sceneGraph.getFinalScore();

    debriefScreen.innerHTML = `
      <div class="debrief-header">
        <h1>Level Complete!</h1>
        <p class="score">Score: ${score.score} (${score.correct}/${score.total} correct - ${score.percentage}%)</p>
      </div>
      <div class="debrief-results">
        ${decisions.map(d => renderLegacyDecisionResult(d)).join('')}
      </div>
      <div class="debrief-actions" style="text-align: center; margin-top: 40px;">
        <button onclick="location.reload()" class="category-btn">Play Again</button>
      </div>
    `;
  }

  /**
   * Legacy decision result rendering (fallback)
   * @param {Object} decision
   * @returns {string}
   */
  function renderLegacyDecisionResult(decision) {
    const isCorrect = decision.correct;
    const selectedClass = decision.selectedClass || 'Timeout';
    const correctClassData = gameData.dscpClasses.classes.find(c => c.id === decision.correctClass);

    // Get RFC reference from scene or class data
    const scene = sceneGraph.getScene(decision.sceneId);
    const rfcRef = scene?.traffic?.rfcReference || correctClassData?.rfcReference;
    const rfcUrl = rfcRef
      ? `https://www.rfc-editor.org/rfc/rfc${rfcRef.rfc}#section-${rfcRef.section}`
      : 'https://www.rfc-editor.org/rfc/rfc4594';
    const rfcLabel = rfcRef
      ? `RFC ${rfcRef.rfc}, Section ${rfcRef.section}: ${rfcRef.title}`
      : 'RFC 4594 Reference';

    return `
      <div class="debrief-item ${isCorrect ? 'correct' : 'incorrect'}">
        <h3>${decision.trafficId}</h3>
        <p class="result-status ${isCorrect ? 'correct' : 'incorrect'}">
          ${isCorrect ? 'Correct!' : 'Incorrect'}
        </p>
        <p>Your answer: <strong>${selectedClass}</strong></p>
        ${
          !isCorrect
            ? `
          <p class="correct-answer">Correct answer: <strong>${decision.correctClass}</strong> (DSCP ${correctClassData?.dscp})</p>
        `
            : ''
        }
        <a class="rfc-link" href="${rfcUrl}" target="_blank" rel="noopener noreferrer">
          ${rfcLabel}
        </a>
      </div>
    `;
  }

  /**
   * Handle level complete
   * @param {Object} _state - Unused but required by handler signature
   */
  function handleLevelComplete(_state) {
    console.log('[Game] Level complete!');
    isPlaying = false;
  }

  /**
   * Handle video end event
   */
  function handleVideoEnd() {
    const state = sceneGraph.getState();

    if (state.state === 'cutscene') {
      sceneGraph.cutsceneComplete();
    } else if (state.state === 'transition') {
      // Determine if was success or failure from last decision
      const decisions = sceneGraph.getDecisions();
      const lastDecision = decisions[decisions.length - 1];
      const wasSuccess = lastDecision?.correct ?? false;
      sceneGraph.advanceAfterTransition(wasSuccess);
    }
  }

  /**
   * Handle input events
   * @param {Object} event
   */
  function handleInput(event) {
    // Forward to decision UI if active
    if (decisionUI.isActive()) {
      decisionUI.handleInput(event.action);
    }

    // Global actions
    if (event.action === 'pause') {
      togglePause();
    }

    // Toggle citations with 'c' key
    if (event.key === 'c' || event.key === 'C') {
      if (citationComponent) {
        citationComponent.toggle();
      }
    }
  }

  /**
   * Handle class selection from decision UI
   * @param {string} classId
   * @param {number} timeRemaining
   * @param {boolean} isCorrect
   */
  function handleClassSelection(classId, timeRemaining, isCorrect) {
    console.log(
      `[Game] Selection: ${classId}, correct: ${isCorrect}, time: ${timeRemaining.toFixed(1)}s`
    );

    if (isCorrect) {
      sceneGraph.handleSuccess(classId, timeRemaining);
    } else {
      sceneGraph.handleFailure(classId, timeRemaining);
    }
  }

  /**
   * Handle timeout from decision UI
   */
  function handleTimeout() {
    console.log('[Game] Timeout!');
    sceneGraph.handleTimeout();
  }

  /**
   * Toggle pause state
   */
  function togglePause() {
    if (isPaused) {
      resume();
    } else {
      pause();
    }
  }

  /**
   * Pause the game
   */
  function pause() {
    if (isPaused || !isPlaying) {
      return;
    }

    isPaused = true;
    videoPlayer.pause();
    decisionUI.pauseTimer();
    audioPlayer.pauseAll();
  }

  /**
   * Resume the game
   */
  function resume() {
    if (!isPaused) {
      return;
    }

    isPaused = false;
    videoPlayer.play().catch(() => {});
    decisionUI.resumeTimer();
    audioPlayer.resumeAll();
  }

  /**
   * Start the game
   */
  async function start() {
    if (isLoading) {
      console.warn('[Game] Cannot start while loading');
      return;
    }

    console.log('[Game] Starting game...');
    isPlaying = true;
    isPaused = false;

    // Hide loading screen
    hideLoadingScreen();

    // Start input handling
    inputHandler.start();

    // Start the scene graph
    sceneGraph.start();
  }

  /**
   * Get game state
   * @returns {GameState}
   */
  function getState() {
    return {
      isLoading,
      isPlaying,
      isPaused,
    };
  }

  return {
    init,
    start,
    pause,
    resume,
    getState,
  };
}

/**
 * Boot the game
 */
async function boot() {
  console.log('[Boot] Is This Packet Important? - Rush Hour at Router 7');

  try {
    // Create game instance
    game = createGame();

    // Initialize
    await game.init();

    // Auto-start after a brief delay
    setTimeout(() => {
      game.start();
    }, 500);
  } catch (err) {
    console.error('[Boot] Failed to start game:', err);

    // Show error to user
    const loadingContent = document.querySelector('.loading-content');
    if (loadingContent) {
      loadingContent.innerHTML = `
        <h1>Error Loading Game</h1>
        <p style="color: #ff4444;">${err.message}</p>
        <p>Please check the console for details.</p>
      `;
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Export for potential external access
export { game };
