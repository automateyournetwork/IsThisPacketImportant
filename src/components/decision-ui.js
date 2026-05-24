/**
 * Decision UI Component
 *
 * Handles the classification decision interface with:
 * - Progressive category unlock (EF, AF, CS, BE)
 * - Two-tier sub-selection (category → specific class)
 * - Timer display with warning states
 *
 * @module decision-ui
 */

import { createTimer, formatTime } from '../lib/timer.js';
// import { getKeyDisplayName } from '../lib/input-handler.js'; // Reserved for key hint display

/**
 * @typedef {Object} DecisionUIConfig
 * @property {HTMLElement} container - Container element for the UI
 * @property {Object} dscpClasses - DSCP classes data
 * @property {Function} onSelect - Callback when a class is selected
 * @property {Function} onTimeout - Callback when timer expires
 */

/**
 * @typedef {Object} DecisionUIState
 * @property {string[]} unlockedCategories - Currently unlocked categories
 * @property {string|null} selectedCategory - Currently selected category
 * @property {boolean} isActive - Whether decision UI is active
 */

/**
 * Create the decision UI component
 * @param {DecisionUIConfig} config
 * @returns {Object} Decision UI control object
 */
export function createDecisionUI(config) {
  const { container, dscpClasses, onSelect, onTimeout } = config;

  // DOM elements
  let decisionUI;
  let timerBar;
  let timerText;
  let categorySelector;
  let classSelector;

  // State
  let unlockedCategories = [];
  let selectedCategory = null;
  let isActive = false;
  let timer = null;
  let currentCorrectClass = null;

  // Category key bindings
  const categoryKeys = {
    EF: '1',
    AF: '2',
    CS: '3',
    BE: '4',
  };

  /**
   * Initialize DOM references
   */
  function initDOM() {
    decisionUI = container.querySelector('#decision-ui');
    // Timer display element (reserved for future animation)
    container.querySelector('#timer-display');
    timerBar = container.querySelector('#timer-bar');
    timerText = container.querySelector('#timer-text');
    categorySelector = container.querySelector('#category-selector');
    classSelector = container.querySelector('#class-selector');

    if (!decisionUI || !categorySelector || !classSelector) {
      console.error('Decision UI elements not found');
    }
  }

  /**
   * Render category buttons
   */
  function renderCategories() {
    if (!categorySelector) {
      return;
    }

    categorySelector.innerHTML = '';

    const categories = ['EF', 'AF', 'CS', 'BE'];

    for (const catId of categories) {
      const category = dscpClasses.categories.find(c => c.id === catId);
      const isUnlocked = unlockedCategories.includes(catId);

      const btn = document.createElement('button');
      btn.className = `category-btn ${isUnlocked ? '' : 'locked'}`;
      btn.disabled = !isUnlocked;
      btn.dataset.category = catId;

      btn.innerHTML = `
        ${category?.name || catId}
        <span class="key-hint">[${categoryKeys[catId]}]</span>
      `;

      if (isUnlocked) {
        btn.addEventListener('click', () => selectCategory(catId));
      }

      categorySelector.appendChild(btn);
    }
  }

  /**
   * Render class sub-selection for a category
   * @param {string} categoryId
   */
  function renderClasses(categoryId) {
    if (!classSelector) {
      return;
    }

    classSelector.innerHTML = '';

    // Get classes for this category
    const classes = dscpClasses.classes.filter(c => c.category === categoryId);

    // For simple categories (EF, BE), just show the single class
    // For complex categories (AF, CS), show sub-options
    if (categoryId === 'EF' || categoryId === 'BE') {
      // Single class - auto-select
      const cls = classes[0];
      if (cls) {
        confirmSelection(cls.id);
      }
      return;
    }

    // Show sub-selection for AF and CS
    classSelector.classList.remove('hidden');

    for (const cls of classes) {
      const btn = document.createElement('button');
      btn.className = 'class-btn';
      btn.dataset.classId = cls.id;

      btn.innerHTML = `
        <span class="class-name">${cls.id}</span>
        <span class="class-dscp">DSCP ${cls.dscp}</span>
      `;

      btn.addEventListener('click', () => confirmSelection(cls.id));
      classSelector.appendChild(btn);
    }
  }

  /**
   * Select a category
   * @param {string} categoryId
   */
  function selectCategory(categoryId) {
    if (!isActive || !unlockedCategories.includes(categoryId)) {
      return;
    }

    selectedCategory = categoryId;

    // Highlight selected category
    const buttons = categorySelector.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('selected', btn.dataset.category === categoryId);
    });

    // Show class sub-selection (or auto-confirm for simple categories)
    renderClasses(categoryId);
  }

  /**
   * Confirm final class selection
   * @param {string} classId
   */
  function confirmSelection(classId) {
    if (!isActive) {
      return;
    }

    const timeRemaining = timer ? timer.getState().remaining : 0;

    // Stop timer
    if (timer) {
      timer.stop();
    }

    isActive = false;

    // Determine if correct
    const isCorrect = classId === currentCorrectClass;

    // Callback
    if (onSelect) {
      onSelect(classId, timeRemaining, isCorrect);
    }
  }

  /**
   * Handle input action
   * @param {string} action
   */
  function handleInput(action) {
    if (!isActive) {
      return;
    }

    // Category selection
    if (action === 'select-ef') {
      selectCategory('EF');
    } else if (action === 'select-af') {
      selectCategory('AF');
    } else if (action === 'select-cs') {
      selectCategory('CS');
    } else if (action === 'select-be') {
      selectCategory('BE');
    } else if (action === 'back') {
      // Go back to category selection
      selectedCategory = null;
      classSelector.classList.add('hidden');
      classSelector.innerHTML = '';
    }
  }

  /**
   * Update timer display
   * @param {Object} state - Timer state
   */
  function updateTimerDisplay(state) {
    if (!timerBar || !timerText) {
      return;
    }

    timerBar.style.width = `${state.percent}%`;
    timerText.textContent = formatTime(state.remaining);

    // Warning state
    if (state.isWarning) {
      timerBar.classList.add('warning');
    } else {
      timerBar.classList.remove('warning');
    }
  }

  /**
   * Handle timer expiration
   */
  function handleTimerExpire() {
    if (!isActive) {
      return;
    }

    isActive = false;

    if (onTimeout) {
      onTimeout();
    }
  }

  /**
   * Show the decision UI for a scene
   * @param {Object} scene - Scene data
   */
  function show(scene) {
    initDOM();

    if (!decisionUI) {
      return;
    }

    // Set state
    unlockedCategories = scene.unlockedCategories || ['EF', 'AF', 'CS', 'BE'];
    selectedCategory = null;
    currentCorrectClass = scene.traffic?.correctClass;
    isActive = true;

    // Render categories
    renderCategories();

    // Hide class selector initially
    classSelector.classList.add('hidden');
    classSelector.innerHTML = '';

    // Show UI
    decisionUI.classList.remove('hidden');

    // Start timer
    if (scene.timer) {
      timer = createTimer({
        duration: scene.timer.duration,
        type: scene.timer.type,
        warningAt: scene.timer.warningAt,
      });

      timer.onTick(updateTimerDisplay);
      timer.onExpire(handleTimerExpire);
      timer.start();

      // Initial display
      updateTimerDisplay(timer.getState());
    }
  }

  /**
   * Hide the decision UI
   */
  function hide() {
    if (timer) {
      timer.stop();
      timer = null;
    }

    isActive = false;
    selectedCategory = null;

    if (decisionUI) {
      decisionUI.classList.add('hidden');
    }

    if (classSelector) {
      classSelector.classList.add('hidden');
      classSelector.innerHTML = '';
    }
  }

  /**
   * Get current state
   * @returns {DecisionUIState}
   */
  function getState() {
    return {
      unlockedCategories: [...unlockedCategories],
      selectedCategory,
      isActive,
    };
  }

  /**
   * Check if UI is currently active
   * @returns {boolean}
   */
  function isUIActive() {
    return isActive;
  }

  /**
   * Pause the timer
   */
  function pauseTimer() {
    if (timer && timer.isRunning()) {
      timer.pause();
    }
  }

  /**
   * Resume the timer
   */
  function resumeTimer() {
    if (timer && timer.isPaused()) {
      timer.start();
    }
  }

  /**
   * Get time remaining
   * @returns {number}
   */
  function getTimeRemaining() {
    return timer ? timer.getState().remaining : 0;
  }

  // Initialize
  initDOM();

  return {
    show,
    hide,
    handleInput,
    getState,
    isActive: isUIActive,
    pauseTimer,
    resumeTimer,
    getTimeRemaining,
  };
}

/**
 * Create a standalone timer display component
 * @param {HTMLElement} container
 * @returns {Object}
 */
export function createTimerDisplay(container) {
  const timerBar = container.querySelector('#timer-bar');
  const timerText = container.querySelector('#timer-text');

  function update(remaining, total, isWarning = false) {
    const percent = (remaining / total) * 100;

    if (timerBar) {
      timerBar.style.width = `${percent}%`;
      timerBar.classList.toggle('warning', isWarning);
    }

    if (timerText) {
      timerText.textContent = formatTime(remaining);
    }
  }

  function reset() {
    if (timerBar) {
      timerBar.style.width = '100%';
      timerBar.classList.remove('warning');
    }
    if (timerText) {
      timerText.textContent = '';
    }
  }

  return { update, reset };
}
