/**
 * Debrief Component
 *
 * Displays post-level performance summary with:
 * - Per-vignette results (correct/incorrect)
 * - RFC citations for learning
 * - Score breakdown and statistics
 *
 * @module components/debrief
 */

/**
 * @typedef {Object} DecisionResult
 * @property {string} sceneId - Scene identifier
 * @property {string} trafficId - Traffic type ID
 * @property {string|null} selectedClass - Player's selection (null if timeout)
 * @property {string} correctClass - Correct answer
 * @property {boolean} correct - Whether answer was correct
 * @property {number} timeRemaining - Time left when answered
 * @property {number} timestamp - When decision was made
 */

/**
 * @typedef {Object} DebriefConfig
 * @property {HTMLElement} container - Container element
 * @property {Object} dscpClasses - DSCP class definitions
 * @property {Object} level - Level data with scenes
 * @property {Array} citations - Citation data
 * @property {Function} [onReplay] - Called when replay button clicked
 * @property {Function} [onNextLevel] - Called when next level clicked
 */

/**
 * Create debrief component
 * @param {DebriefConfig} config
 */
export function createDebriefComponent(config) {
  const { container, dscpClasses, level, onReplay, onNextLevel } = config;
  // Note: config.citations is available but not currently used

  // Create debrief screen element
  const debriefScreen = document.createElement('div');
  debriefScreen.id = 'debrief-screen';
  debriefScreen.className = 'debrief-screen hidden';
  debriefScreen.setAttribute('role', 'main');
  debriefScreen.setAttribute('aria-label', 'Level Results');
  container.appendChild(debriefScreen);

  // Build scene lookup map
  const sceneMap = new Map(level.scenes.map(s => [s.id, s]));

  /**
   * Show debrief with decision results
   * @param {DecisionResult[]} decisions
   */
  function show(decisions) {
    const stats = calculateStats(decisions);
    debriefScreen.innerHTML = renderDebrief(decisions, stats);
    debriefScreen.classList.remove('hidden');

    // Add event listeners
    setupEventListeners();
  }

  /**
   * Hide debrief screen
   */
  function hide() {
    debriefScreen.classList.add('hidden');
  }

  /**
   * Calculate statistics from decisions
   * @param {DecisionResult[]} decisions
   * @returns {Object}
   */
  function calculateStats(decisions) {
    const correct = decisions.filter(d => d.correct).length;
    const incorrect = decisions.filter(d => !d.correct && d.selectedClass !== null).length;
    const timeouts = decisions.filter(d => d.selectedClass === null).length;
    const total = decisions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Calculate average response time for correct answers
    const correctDecisions = decisions.filter(d => d.correct);
    const avgResponseTime =
      correctDecisions.length > 0
        ? correctDecisions.reduce((sum, d) => sum + (8 - d.timeRemaining), 0) /
          correctDecisions.length
        : 0;

    // Determine grade
    let grade;
    if (percentage >= 90) {
      grade = 'A';
    } else if (percentage >= 80) {
      grade = 'B';
    } else if (percentage >= 70) {
      grade = 'C';
    } else if (percentage >= 60) {
      grade = 'D';
    } else {
      grade = 'F';
    }

    return {
      correct,
      incorrect,
      timeouts,
      total,
      percentage,
      score: correct * 100,
      avgResponseTime: avgResponseTime.toFixed(1),
      grade,
    };
  }

  /**
   * Render full debrief screen
   * @param {DecisionResult[]} decisions
   * @param {Object} stats
   * @returns {string}
   */
  function renderDebrief(decisions, stats) {
    return `
      <div class="debrief-content">
        <header class="debrief-header">
          <h1>Level Complete!</h1>
          <div class="debrief-grade grade-${stats.grade.toLowerCase()}">${stats.grade}</div>
        </header>

        <section class="debrief-summary">
          <div class="stat-card">
            <span class="stat-value">${stats.score}</span>
            <span class="stat-label">Score</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${stats.percentage}%</span>
            <span class="stat-label">Accuracy</span>
          </div>
          <div class="stat-card correct">
            <span class="stat-value">${stats.correct}</span>
            <span class="stat-label">Correct</span>
          </div>
          <div class="stat-card incorrect">
            <span class="stat-value">${stats.incorrect + stats.timeouts}</span>
            <span class="stat-label">Incorrect</span>
          </div>
        </section>

        <section class="debrief-results" aria-label="Decision Results">
          <h2>Your Decisions</h2>
          <div class="results-grid">
            ${decisions.map(d => renderDecisionCard(d)).join('')}
          </div>
        </section>

        <section class="debrief-study" aria-label="Study Resources">
          <h2>Learn More</h2>
          <p class="study-intro">Review these RFC sections to improve your understanding:</p>
          <div class="study-links">
            ${renderStudyLinks(decisions)}
          </div>
        </section>

        <footer class="debrief-actions">
          <button class="debrief-btn replay-btn" data-action="replay">
            Play Again
          </button>
          ${
            onNextLevel
              ? `
            <button class="debrief-btn next-btn" data-action="next">
              Next Level
            </button>
          `
              : ''
          }
        </footer>
      </div>
    `;
  }

  /**
   * Render a single decision card
   * @param {DecisionResult} decision
   * @returns {string}
   */
  function renderDecisionCard(decision) {
    const isCorrect = decision.correct;
    const isTimeout = decision.selectedClass === null;
    const scene = sceneMap.get(decision.sceneId);
    const traffic = scene?.traffic;

    const selectedClass = decision.selectedClass || 'No Answer';
    const correctClassData = dscpClasses.classes.find(c => c.id === decision.correctClass);

    // Get RFC reference
    const rfcRef = traffic?.rfcReference;
    const rfcUrl = rfcRef
      ? `https://www.rfc-editor.org/rfc/rfc${rfcRef.rfc}#section-${rfcRef.section}`
      : null;

    return `
      <div class="decision-card ${isCorrect ? 'correct' : 'incorrect'}" data-scene="${decision.sceneId}">
        <div class="decision-icon">
          ${isCorrect ? '&#x2714;' : '&#x2718;'}
        </div>
        <div class="decision-details">
          <h3 class="decision-traffic">${traffic?.name || decision.trafficId}</h3>
          <p class="decision-description">${traffic?.description || ''}</p>

          <div class="decision-answer">
            <span class="answer-label">Your answer:</span>
            <span class="answer-value ${isCorrect ? 'correct' : 'incorrect'}">
              ${selectedClass}${isTimeout ? ' (timeout)' : ''}
            </span>
          </div>

          ${
            !isCorrect
              ? `
            <div class="decision-correct">
              <span class="answer-label">Correct answer:</span>
              <span class="answer-value correct">
                ${decision.correctClass}
                <span class="dscp-value">(DSCP ${correctClassData?.dscp})</span>
              </span>
            </div>
            <p class="decision-explanation">
              ${correctClassData?.phbBehavior || ''}
            </p>
          `
              : ''
          }

          ${
            rfcUrl
              ? `
            <a href="${rfcUrl}" target="_blank" rel="noopener noreferrer" class="rfc-link">
              RFC ${rfcRef.rfc}, Section ${rfcRef.section}: ${rfcRef.title}
            </a>
          `
              : ''
          }
        </div>
        <div class="decision-time">
          ${decision.timeRemaining > 0 ? `${decision.timeRemaining.toFixed(1)}s` : '0s'}
        </div>
      </div>
    `;
  }

  /**
   * Render study links for incorrect decisions
   * @param {DecisionResult[]} decisions
   * @returns {string}
   */
  function renderStudyLinks(decisions) {
    // Collect unique RFC references from incorrect decisions
    const incorrectRfcs = new Map();

    for (const decision of decisions.filter(d => !d.correct)) {
      const scene = sceneMap.get(decision.sceneId);
      const rfcRef = scene?.traffic?.rfcReference;

      if (rfcRef) {
        const key = `${rfcRef.rfc}-${rfcRef.section}`;
        if (!incorrectRfcs.has(key)) {
          incorrectRfcs.set(key, {
            rfc: rfcRef.rfc,
            section: rfcRef.section,
            title: rfcRef.title,
            count: 1,
          });
        } else {
          incorrectRfcs.get(key).count++;
        }
      }
    }

    if (incorrectRfcs.size === 0) {
      return `<p class="all-correct">Perfect score! No study recommendations needed.</p>`;
    }

    const links = Array.from(incorrectRfcs.values())
      .sort((a, b) => b.count - a.count)
      .map(ref => {
        const url = `https://www.rfc-editor.org/rfc/rfc${ref.rfc}#section-${ref.section}`;
        return `
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="study-link">
            <span class="study-rfc">RFC ${ref.rfc}</span>
            <span class="study-section">Section ${ref.section}</span>
            <span class="study-title">${ref.title}</span>
          </a>
        `;
      });

    return links.join('');
  }

  /**
   * Set up event listeners for buttons
   */
  function setupEventListeners() {
    debriefScreen.querySelectorAll('.debrief-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        if (action === 'replay' && onReplay) {
          onReplay();
        } else if (action === 'next' && onNextLevel) {
          onNextLevel();
        }
      });
    });
  }

  /**
   * Check if debrief is visible
   * @returns {boolean}
   */
  function isVisible() {
    return !debriefScreen.classList.contains('hidden');
  }

  /**
   * Destroy component
   */
  function destroy() {
    debriefScreen.remove();
  }

  return {
    show,
    hide,
    isVisible,
    destroy,
  };
}
