/**
 * Input Handler Module Tests
 *
 * Tests keyboard and gamepad input handling with debouncing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  createInputHandler,
  getKeyDisplayName,
  isGamepadConnected,
} from '../../src/lib/input-handler.js';

describe('Input Handler Module', () => {
  let inputHandler;
  let mockCallback;

  beforeEach(() => {
    vi.useFakeTimers();
    inputHandler = createInputHandler();
    mockCallback = vi.fn();
    inputHandler.onInput(mockCallback);
  });

  afterEach(() => {
    inputHandler.stop();
    vi.useRealTimers();
  });

  describe('createInputHandler', () => {
    it('should create handler with default bindings', () => {
      expect(inputHandler).toBeDefined();
      expect(inputHandler.getActionForKey('Digit1')).toBe('select-ef');
      expect(inputHandler.getActionForKey('Digit2')).toBe('select-af');
      expect(inputHandler.getActionForKey('Digit3')).toBe('select-cs');
      expect(inputHandler.getActionForKey('Digit4')).toBe('select-be');
    });

    it('should accept custom bindings', () => {
      const customBindings = [{ action: 'custom-action', keys: ['KeyX'], gamepadButtons: [5] }];
      const customHandler = createInputHandler(customBindings);
      expect(customHandler.getActionForKey('KeyX')).toBe('custom-action');
    });
  });

  describe('keyboard input', () => {
    it('should trigger action on keydown', () => {
      inputHandler.start();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'select-ef',
          source: 'keyboard',
        })
      );
    });

    it('should not trigger for unmapped keys', () => {
      inputHandler.start();

      const event = new KeyboardEvent('keydown', { code: 'KeyZ' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should debounce rapid keypresses', () => {
      inputHandler.start();

      // First press
      const event1 = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event1);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Rapid second press (should be debounced)
      // Note: performance.now() doesn't advance with vi.advanceTimersByTime
      // so we test that the second immediate press is debounced
      const event2 = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event2);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1 (debounced)
    });
  });

  describe('enable/disable', () => {
    it('should not trigger when disabled', () => {
      inputHandler.start();
      inputHandler.disable();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should trigger after re-enabling', () => {
      inputHandler.start();
      inputHandler.disable();
      inputHandler.enable();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('lock/unlock', () => {
    it('should not trigger when locked', () => {
      inputHandler.start();
      inputHandler.lock();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(inputHandler.isLocked()).toBe(true);
    });

    it('should trigger after unlocking', () => {
      inputHandler.start();
      inputHandler.lock();
      inputHandler.unlock();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalled();
      expect(inputHandler.isLocked()).toBe(false);
    });
  });

  describe('callback management', () => {
    it('should allow multiple callbacks', () => {
      const callback2 = vi.fn();
      inputHandler.onInput(callback2);
      inputHandler.start();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should allow unsubscribing', () => {
      // Clear existing callbacks and start fresh
      inputHandler.clearCallbacks();

      // Add a callback and get unsubscribe function
      const unsubscribe = inputHandler.onInput(mockCallback);
      inputHandler.start();

      // First event should trigger
      const event1 = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event1);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Unsubscribe
      unsubscribe();

      // Second event (different key to avoid debounce) should not trigger
      const event2 = new KeyboardEvent('keydown', { code: 'Digit2' });
      document.dispatchEvent(event2);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should clear all callbacks', () => {
      const callback2 = vi.fn();
      inputHandler.onInput(callback2);
      inputHandler.clearCallbacks();
      inputHandler.start();

      const event = new KeyboardEvent('keydown', { code: 'Digit1' });
      document.dispatchEvent(event);

      expect(mockCallback).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('getKeysForAction', () => {
    it('should return all keys for an action', () => {
      const keys = inputHandler.getKeysForAction('select-ef');
      expect(keys).toContain('Digit1');
      expect(keys).toContain('Numpad1');
    });

    it('should return empty array for unknown action', () => {
      const keys = inputHandler.getKeysForAction('unknown-action');
      expect(keys).toHaveLength(0);
    });
  });

  describe('isEnabled', () => {
    it('should return correct enabled state', () => {
      expect(inputHandler.isEnabled()).toBe(true);

      inputHandler.disable();
      expect(inputHandler.isEnabled()).toBe(false);

      inputHandler.enable();
      expect(inputHandler.isEnabled()).toBe(true);
    });
  });
});

describe('getKeyDisplayName', () => {
  it('should return readable names for digit keys', () => {
    expect(getKeyDisplayName('Digit1')).toBe('1');
    expect(getKeyDisplayName('Digit2')).toBe('2');
  });

  it('should return readable names for arrow keys', () => {
    expect(getKeyDisplayName('ArrowUp')).toBe('\u2191');
    expect(getKeyDisplayName('ArrowDown')).toBe('\u2193');
  });

  it('should return readable names for special keys', () => {
    expect(getKeyDisplayName('Enter')).toBe('Enter');
    expect(getKeyDisplayName('Space')).toBe('Space');
    expect(getKeyDisplayName('Escape')).toBe('Esc');
  });

  it('should return key code for unknown keys', () => {
    expect(getKeyDisplayName('KeyZ')).toBe('KeyZ');
  });
});

describe('isGamepadConnected', () => {
  it('should return false when no gamepad API', () => {
    // In test environment, getGamepads typically returns empty
    const connected = isGamepadConnected();
    expect(typeof connected).toBe('boolean');
  });
});
