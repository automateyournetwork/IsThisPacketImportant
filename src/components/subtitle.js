/**
 * Subtitle Component
 *
 * Displays dialog subtitles synchronized with audio/video playback.
 * Supports multiple characters, styling, and accessibility features.
 *
 * @module components/subtitle
 */

/**
 * @typedef {Object} DialogLine
 * @property {string} id - Line identifier
 * @property {string} character - Character speaking
 * @property {string} text - Dialog text
 * @property {Object} timing - Start and end times in seconds
 * @property {string} [emotion] - Emotion indicator
 * @property {string} [style] - Special styling (e.g., "announcement")
 */

/**
 * @typedef {Object} SubtitleConfig
 * @property {HTMLElement} container - Container for subtitle display
 * @property {boolean} [enabled=true] - Whether subtitles are enabled
 * @property {string} [position='bottom'] - Position: 'bottom', 'top'
 * @property {Object} [characterColors] - Map of character to color
 */

// Default character colors
const DEFAULT_COLORS = {
  narrator: '#00d4aa',
  mentor: '#0088ff',
  sender: '#ffaa00',
  router: '#ff4444',
};

/**
 * Create subtitle component
 * @param {SubtitleConfig} config
 */
export function createSubtitleComponent(config) {
  const {
    container,
    enabled = true,
    position = 'bottom',
    characterColors = DEFAULT_COLORS,
  } = config;

  // State
  let isEnabled = enabled;
  let currentDialog = null;
  let currentLineIndex = -1;
  let animationFrame = null;
  let startTime = 0;

  // Create subtitle container
  const subtitleContainer = document.createElement('div');
  subtitleContainer.id = 'subtitle-container';
  subtitleContainer.className = `subtitle-container subtitle-${position}`;
  subtitleContainer.setAttribute('role', 'region');
  subtitleContainer.setAttribute('aria-label', 'Subtitles');
  subtitleContainer.setAttribute('aria-live', 'polite');

  const subtitleText = document.createElement('div');
  subtitleText.id = 'subtitle-text';
  subtitleText.className = 'subtitle-text';

  const characterLabel = document.createElement('span');
  characterLabel.className = 'subtitle-character';

  const dialogText = document.createElement('span');
  dialogText.className = 'subtitle-dialog';

  subtitleText.appendChild(characterLabel);
  subtitleText.appendChild(dialogText);
  subtitleContainer.appendChild(subtitleText);
  container.appendChild(subtitleContainer);

  // Create toggle button
  const toggleButton = document.createElement('button');
  toggleButton.id = 'subtitle-toggle';
  toggleButton.className = 'subtitle-toggle';
  toggleButton.setAttribute('aria-pressed', isEnabled.toString());
  toggleButton.innerHTML = `
    <span class="subtitle-toggle-icon">${isEnabled ? 'CC' : 'CC'}</span>
  `;
  toggleButton.title = 'Toggle Subtitles (S)';
  container.appendChild(toggleButton);

  toggleButton.addEventListener('click', toggle);

  /**
   * Toggle subtitles on/off
   */
  function toggle() {
    isEnabled = !isEnabled;
    toggleButton.setAttribute('aria-pressed', isEnabled.toString());
    subtitleContainer.classList.toggle('subtitle-hidden', !isEnabled);

    if (!isEnabled) {
      clear();
    }
  }

  /**
   * Set subtitle visibility
   * @param {boolean} visible
   */
  function setEnabled(visible) {
    if (isEnabled !== visible) {
      toggle();
    }
  }

  /**
   * Load dialog for a scene
   * @param {Object} dialog - Dialog data with lines array
   */
  function loadDialog(dialog) {
    currentDialog = dialog;
    currentLineIndex = -1;
    startTime = 0;
    clear();
  }

  /**
   * Start playing subtitles from the beginning
   * @param {number} [offset=0] - Start offset in seconds
   */
  function play(offset = 0) {
    if (!currentDialog || !currentDialog.lines) {
      return;
    }

    startTime = performance.now() / 1000 - offset;
    currentLineIndex = -1;

    // Start update loop
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    update();
  }

  /**
   * Pause subtitle playback
   */
  function pause() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
  }

  /**
   * Resume subtitle playback
   */
  function resume() {
    if (currentDialog && !animationFrame) {
      update();
    }
  }

  /**
   * Stop and clear subtitles
   */
  function stop() {
    pause();
    clear();
    currentDialog = null;
    currentLineIndex = -1;
  }

  /**
   * Clear current subtitle display
   */
  function clear() {
    characterLabel.textContent = '';
    dialogText.textContent = '';
    subtitleText.className = 'subtitle-text';
    subtitleText.style.display = 'none';
  }

  /**
   * Display a specific line
   * @param {DialogLine} line
   */
  function showLine(line) {
    if (!isEnabled) {
      return;
    }

    const color = characterColors[line.character] || '#ffffff';

    characterLabel.textContent = formatCharacterName(line.character);
    characterLabel.style.color = color;

    dialogText.textContent = line.text;

    // Apply special styles
    subtitleText.className = 'subtitle-text';
    if (line.style === 'announcement') {
      subtitleText.classList.add('subtitle-announcement');
    }
    if (line.emotion) {
      subtitleText.classList.add(`subtitle-emotion-${line.emotion}`);
    }

    subtitleText.style.display = 'block';
  }

  /**
   * Format character name for display
   * @param {string} character
   * @returns {string}
   */
  function formatCharacterName(character) {
    if (character === 'narrator') {
      return '';
    }
    return character.charAt(0).toUpperCase() + character.slice(1) + ': ';
  }

  /**
   * Update loop - check current time and show appropriate line
   */
  function update() {
    if (!currentDialog || !currentDialog.lines) {
      return;
    }

    const currentTime = performance.now() / 1000 - startTime;
    const lines = currentDialog.lines;

    // Find the line that should be showing
    let activeLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (currentTime >= line.timing.start && currentTime < line.timing.end) {
        activeLineIndex = i;
        break;
      }
    }

    // Update display if line changed
    if (activeLineIndex !== currentLineIndex) {
      currentLineIndex = activeLineIndex;

      if (activeLineIndex >= 0) {
        showLine(lines[activeLineIndex]);
      } else if (currentTime >= (lines[lines.length - 1]?.timing.end || 0)) {
        // Past the last line, clear and stop
        clear();
        animationFrame = null;
        return;
      } else {
        // Between lines
        clear();
      }
    }

    // Continue update loop
    animationFrame = requestAnimationFrame(update);
  }

  /**
   * Jump to a specific time
   * @param {number} time - Time in seconds
   */
  function seek(time) {
    startTime = performance.now() / 1000 - time;
    currentLineIndex = -1;

    if (!animationFrame) {
      update();
    }
  }

  /**
   * Display a single line immediately (no timing)
   * @param {string} character
   * @param {string} text
   * @param {Object} [options]
   */
  function showImmediate(character, text, options = {}) {
    showLine({
      id: 'immediate',
      character,
      text,
      timing: { start: 0, end: Infinity },
      ...options,
    });
  }

  /**
   * Check if subtitles are enabled
   * @returns {boolean}
   */
  function isSubtitleEnabled() {
    return isEnabled;
  }

  /**
   * Destroy component
   */
  function destroy() {
    pause();
    subtitleContainer.remove();
    toggleButton.remove();
  }

  // Initial visibility
  subtitleContainer.classList.toggle('subtitle-hidden', !isEnabled);

  return {
    toggle,
    setEnabled,
    loadDialog,
    play,
    pause,
    resume,
    stop,
    clear,
    showLine,
    showImmediate,
    seek,
    isEnabled: isSubtitleEnabled,
    destroy,
  };
}

/**
 * Load dialog from JSON file
 * @param {string} path
 * @returns {Promise<Object>}
 */
export async function loadDialogFile(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load dialog: ${response.status}`);
  }
  return await response.json();
}
