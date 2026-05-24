/**
 * Timer Module
 *
 * Variable countdown timer for decision windows.
 * Supports tutorial (8s), standard (5s), and boss (3s) modes.
 *
 * @module timer
 */

/**
 * @typedef {'tutorial' | 'standard' | 'boss'} TimerType
 */

/**
 * @typedef {Object} TimerConfig
 * @property {number} duration - Timer duration in seconds
 * @property {TimerType} type - Timer type
 * @property {number} [warningAt] - Seconds remaining to trigger warning
 */

/**
 * @typedef {Object} TimerState
 * @property {number} remaining - Seconds remaining
 * @property {number} elapsed - Seconds elapsed
 * @property {number} total - Total duration
 * @property {number} percent - Percentage remaining (0-100)
 * @property {boolean} isWarning - Whether in warning state
 * @property {boolean} isExpired - Whether timer has expired
 * @property {TimerType} type - Timer type
 */

/**
 * @callback TimerCallback
 * @param {TimerState} state - Current timer state
 */

/** Default timer durations by type */
const DEFAULT_DURATIONS = {
  tutorial: 8,
  standard: 5,
  boss: 3,
};

/** Default warning thresholds by type */
const DEFAULT_WARNINGS = {
  tutorial: 3,
  standard: 2,
  boss: 1,
};

/**
 * Create a new timer instance
 * @param {TimerConfig} config - Timer configuration
 * @returns {Object} Timer control object
 */
export function createTimer(config) {
  const duration = config.duration ?? DEFAULT_DURATIONS[config.type] ?? 5;
  const warningAt = config.warningAt ?? DEFAULT_WARNINGS[config.type] ?? 2;
  const type = config.type ?? 'standard';

  let startTime = null;
  let pausedAt = null;
  let animationFrameId = null;
  let onTickCallback = null;
  let onExpireCallback = null;
  let onWarningCallback = null;
  let warningTriggered = false;

  /**
   * Get current timer state
   * @returns {TimerState}
   */
  function getState() {
    if (startTime === null) {
      return {
        remaining: duration,
        elapsed: 0,
        total: duration,
        percent: 100,
        isWarning: false,
        isExpired: false,
        type,
      };
    }

    const now = pausedAt ?? performance.now();
    const elapsed = (now - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsed);
    const percent = (remaining / duration) * 100;
    const isWarning = remaining <= warningAt && remaining > 0;
    const isExpired = remaining <= 0;

    return {
      remaining,
      elapsed: Math.min(elapsed, duration),
      total: duration,
      percent,
      isWarning,
      isExpired,
      type,
    };
  }

  /**
   * Animation frame tick handler
   */
  function tick() {
    const state = getState();

    if (onTickCallback) {
      onTickCallback(state);
    }

    if (state.isWarning && !warningTriggered) {
      warningTriggered = true;
      if (onWarningCallback) {
        onWarningCallback(state);
      }
    }

    if (state.isExpired) {
      stop();
      if (onExpireCallback) {
        onExpireCallback(state);
      }
      return;
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Start the timer
   */
  function start() {
    if (startTime !== null && pausedAt === null) {
      return; // Already running
    }

    if (pausedAt !== null) {
      // Resume from pause
      const pauseDuration = performance.now() - pausedAt;
      startTime += pauseDuration;
      pausedAt = null;
    } else {
      // Fresh start
      startTime = performance.now();
      warningTriggered = false;
    }

    animationFrameId = requestAnimationFrame(tick);
  }

  /**
   * Pause the timer
   */
  function pause() {
    if (pausedAt !== null || startTime === null) {
      return; // Already paused or not started
    }

    pausedAt = performance.now();
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  /**
   * Stop the timer completely
   */
  function stop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    startTime = null;
    pausedAt = null;
  }

  /**
   * Reset the timer to initial state
   */
  function reset() {
    stop();
    warningTriggered = false;
  }

  /**
   * Check if timer is running
   * @returns {boolean}
   */
  function isRunning() {
    return startTime !== null && pausedAt === null;
  }

  /**
   * Check if timer is paused
   * @returns {boolean}
   */
  function isPaused() {
    return pausedAt !== null;
  }

  /**
   * Set callback for each tick (called every frame)
   * @param {TimerCallback} callback
   */
  function onTick(callback) {
    onTickCallback = callback;
  }

  /**
   * Set callback for when timer expires
   * @param {TimerCallback} callback
   */
  function onExpire(callback) {
    onExpireCallback = callback;
  }

  /**
   * Set callback for when warning threshold is reached
   * @param {TimerCallback} callback
   */
  function onWarning(callback) {
    onWarningCallback = callback;
  }

  return {
    start,
    pause,
    stop,
    reset,
    getState,
    isRunning,
    isPaused,
    onTick,
    onExpire,
    onWarning,
  };
}

/**
 * Get the default duration for a timer type
 * @param {TimerType} type
 * @returns {number}
 */
export function getDefaultDuration(type) {
  return DEFAULT_DURATIONS[type] ?? 5;
}

/**
 * Get the default warning threshold for a timer type
 * @param {TimerType} type
 * @returns {number}
 */
export function getDefaultWarning(type) {
  return DEFAULT_WARNINGS[type] ?? 2;
}

/**
 * Format seconds as display string
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const rounded = Math.ceil(seconds);
  return rounded.toString();
}
