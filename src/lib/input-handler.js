/**
 * Input Handler Module
 *
 * Handles keyboard and gamepad input with debouncing.
 * Designed for <50ms input latency per performance requirements.
 *
 * @module input-handler
 */

/**
 * @typedef {Object} InputBinding
 * @property {string} action - Action name
 * @property {string[]} keys - Keyboard keys (KeyboardEvent.code)
 * @property {number[]} [gamepadButtons] - Gamepad button indices
 */

/**
 * @typedef {Object} InputEvent
 * @property {string} action - Action that was triggered
 * @property {string} source - 'keyboard' or 'gamepad'
 * @property {number} timestamp - Event timestamp
 */

/**
 * @callback InputCallback
 * @param {InputEvent} event
 */

/** Debounce time in milliseconds */
const DEBOUNCE_MS = 50;

/** Default key bindings for game actions */
const DEFAULT_BINDINGS = [
  { action: 'select-ef', keys: ['Digit1', 'Numpad1'], gamepadButtons: [0] },
  { action: 'select-af', keys: ['Digit2', 'Numpad2'], gamepadButtons: [1] },
  { action: 'select-cs', keys: ['Digit3', 'Numpad3'], gamepadButtons: [2] },
  { action: 'select-be', keys: ['Digit4', 'Numpad4'], gamepadButtons: [3] },
  { action: 'confirm', keys: ['Enter', 'Space'], gamepadButtons: [9] },
  { action: 'back', keys: ['Escape', 'Backspace'], gamepadButtons: [8] },
  { action: 'toggle-citations', keys: ['KeyC'], gamepadButtons: [4] },
  { action: 'pause', keys: ['KeyP'], gamepadButtons: [6] },
  { action: 'nav-up', keys: ['ArrowUp', 'KeyW'], gamepadButtons: [12] },
  { action: 'nav-down', keys: ['ArrowDown', 'KeyS'], gamepadButtons: [13] },
  { action: 'nav-left', keys: ['ArrowLeft', 'KeyA'], gamepadButtons: [14] },
  { action: 'nav-right', keys: ['ArrowRight', 'KeyD'], gamepadButtons: [15] },
];

/**
 * Create an input handler instance
 * @param {InputBinding[]} [bindings] - Custom bindings (uses defaults if not provided)
 * @returns {Object} Input handler control object
 */
export function createInputHandler(bindings = DEFAULT_BINDINGS) {
  /** @type {Map<string, string>} Key code to action mapping */
  const keyToAction = new Map();

  /** @type {Map<number, string>} Gamepad button to action mapping */
  const buttonToAction = new Map();

  /** @type {Map<string, number>} Last trigger time per action (for debouncing) */
  const lastTriggerTime = new Map();

  /** @type {Set<InputCallback>} Registered callbacks */
  const callbacks = new Set();

  /** @type {boolean} Whether input is currently enabled */
  let enabled = true;

  /** @type {boolean} Whether input is locked (during transitions) */
  let locked = false;

  /** @type {number|null} Gamepad polling interval ID */
  let gamepadPollId = null;

  /** @type {Set<number>} Currently pressed gamepad buttons */
  const pressedButtons = new Set();

  // Build lookup maps from bindings
  for (const binding of bindings) {
    for (const key of binding.keys) {
      keyToAction.set(key, binding.action);
    }
    if (binding.gamepadButtons) {
      for (const button of binding.gamepadButtons) {
        buttonToAction.set(button, binding.action);
      }
    }
  }

  /**
   * Check if an action should be debounced
   * @param {string} action
   * @param {number} timestamp
   * @returns {boolean} True if should ignore (debounced)
   */
  function shouldDebounce(action, timestamp) {
    const lastTime = lastTriggerTime.get(action);
    if (lastTime !== undefined && timestamp - lastTime < DEBOUNCE_MS) {
      return true;
    }
    lastTriggerTime.set(action, timestamp);
    return false;
  }

  /**
   * Trigger an input event
   * @param {string} action
   * @param {string} source
   */
  function triggerAction(action, source) {
    if (!enabled || locked) {
      return;
    }

    const timestamp = performance.now();
    if (shouldDebounce(action, timestamp)) {
      return;
    }

    const event = { action, source, timestamp };
    for (const callback of callbacks) {
      callback(event);
    }
  }

  /**
   * Handle keyboard key down event
   * @param {KeyboardEvent} e
   */
  function handleKeyDown(e) {
    const action = keyToAction.get(e.code);
    if (action) {
      e.preventDefault();
      triggerAction(action, 'keyboard');
    }
  }

  /**
   * Poll gamepad state
   */
  function pollGamepad() {
    const gamepads = navigator.getGamepads();
    for (const gamepad of gamepads) {
      if (!gamepad) {
        continue;
      }

      for (let i = 0; i < gamepad.buttons.length; i++) {
        const button = gamepad.buttons[i];
        const wasPressed = pressedButtons.has(i);
        const isPressed = button.pressed;

        if (isPressed && !wasPressed) {
          pressedButtons.add(i);
          const action = buttonToAction.get(i);
          if (action) {
            triggerAction(action, 'gamepad');
          }
        } else if (!isPressed && wasPressed) {
          pressedButtons.delete(i);
        }
      }
    }
  }

  /**
   * Start listening for input
   */
  function start() {
    document.addEventListener('keydown', handleKeyDown);

    // Start gamepad polling if gamepads are available
    if ('getGamepads' in navigator) {
      gamepadPollId = setInterval(pollGamepad, 16); // ~60fps
    }
  }

  /**
   * Stop listening for input
   */
  function stop() {
    document.removeEventListener('keydown', handleKeyDown);

    if (gamepadPollId !== null) {
      clearInterval(gamepadPollId);
      gamepadPollId = null;
    }

    pressedButtons.clear();
    lastTriggerTime.clear();
  }

  /**
   * Enable input processing
   */
  function enable() {
    enabled = true;
  }

  /**
   * Disable input processing
   */
  function disable() {
    enabled = false;
  }

  /**
   * Lock input (during transitions)
   */
  function lock() {
    locked = true;
  }

  /**
   * Unlock input
   */
  function unlock() {
    locked = false;
  }

  /**
   * Check if input is locked
   * @returns {boolean}
   */
  function isLocked() {
    return locked;
  }

  /**
   * Check if input is enabled
   * @returns {boolean}
   */
  function isEnabled() {
    return enabled;
  }

  /**
   * Register a callback for input events
   * @param {InputCallback} callback
   * @returns {Function} Unsubscribe function
   */
  function onInput(callback) {
    callbacks.add(callback);
    return () => callbacks.delete(callback);
  }

  /**
   * Clear all registered callbacks
   */
  function clearCallbacks() {
    callbacks.clear();
  }

  /**
   * Get the action for a specific key code
   * @param {string} keyCode
   * @returns {string|undefined}
   */
  function getActionForKey(keyCode) {
    return keyToAction.get(keyCode);
  }

  /**
   * Get all keys for a specific action
   * @param {string} action
   * @returns {string[]}
   */
  function getKeysForAction(action) {
    const keys = [];
    for (const [key, act] of keyToAction) {
      if (act === action) {
        keys.push(key);
      }
    }
    return keys;
  }

  return {
    start,
    stop,
    enable,
    disable,
    lock,
    unlock,
    isLocked,
    isEnabled,
    onInput,
    clearCallbacks,
    getActionForKey,
    getKeysForAction,
  };
}

/**
 * Get a human-readable key name
 * @param {string} keyCode - KeyboardEvent.code value
 * @returns {string}
 */
export function getKeyDisplayName(keyCode) {
  const displayNames = {
    Digit1: '1',
    Digit2: '2',
    Digit3: '3',
    Digit4: '4',
    Numpad1: 'Num1',
    Numpad2: 'Num2',
    Numpad3: 'Num3',
    Numpad4: 'Num4',
    Enter: 'Enter',
    Space: 'Space',
    Escape: 'Esc',
    Backspace: 'Back',
    ArrowUp: '\u2191',
    ArrowDown: '\u2193',
    ArrowLeft: '\u2190',
    ArrowRight: '\u2192',
    KeyW: 'W',
    KeyA: 'A',
    KeyS: 'S',
    KeyD: 'D',
    KeyC: 'C',
    KeyP: 'P',
  };
  return displayNames[keyCode] ?? keyCode;
}

/**
 * Check if gamepad is connected
 * @returns {boolean}
 */
export function isGamepadConnected() {
  if (!('getGamepads' in navigator)) {
    return false;
  }
  const gamepads = navigator.getGamepads();
  return Array.from(gamepads).some(gp => gp !== null);
}
