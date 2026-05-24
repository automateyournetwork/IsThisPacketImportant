/**
 * Citation Component
 *
 * Displays RFC citations and first-use term definitions for educational content.
 * Supports toggle visibility, term introductions, and citation badges.
 */

/**
 * @typedef {Object} Citation
 * @property {string} id - Unique citation identifier
 * @property {string} claim - The claim being cited
 * @property {number} rfc - RFC number
 * @property {string} section - Section within the RFC
 * @property {string} title - Section title
 * @property {string} [quote] - Direct quote from RFC
 * @property {string} url - URL to RFC section
 */

/**
 * @typedef {Object} FirstUseTerm
 * @property {string} term - The technical term
 * @property {string} definition - Definition of the term
 * @property {string} [citation] - Associated citation ID
 */

/**
 * @typedef {Object} CitationConfig
 * @property {HTMLElement} container - DOM container for citations
 * @property {Citation[]} citations - All available citations
 * @property {boolean} [showByDefault=false] - Whether to show citations initially
 * @property {(citationId: string) => void} [onCitationClick] - Callback when citation clicked
 */

/**
 * Creates a citation display component
 * @param {CitationConfig} config
 */
export function createCitationComponent(config) {
  const { container, citations, showByDefault = false, onCitationClick } = config;

  // Build citation lookup map
  const citationMap = new Map(citations.map(c => [c.id, c]));

  // Track state
  let visible = showByDefault;
  let activeCitations = [];
  const shownTerms = new Set();

  // Create DOM structure
  const citationContainer = document.createElement('div');
  citationContainer.className = 'citation-container';
  citationContainer.setAttribute('role', 'complementary');
  citationContainer.setAttribute('aria-label', 'RFC Citations');

  const toggleButton = document.createElement('button');
  toggleButton.className = 'citation-toggle';
  toggleButton.setAttribute('aria-pressed', visible.toString());
  toggleButton.innerHTML = `
    <span class="citation-toggle-icon"></span>
    <span class="citation-toggle-label">RFC Citations</span>
  `;

  const citationList = document.createElement('div');
  citationList.className = 'citation-list';
  citationList.setAttribute('aria-hidden', (!visible).toString());

  const termOverlay = document.createElement('div');
  termOverlay.className = 'term-overlay';
  termOverlay.setAttribute('role', 'dialog');
  termOverlay.setAttribute('aria-modal', 'true');
  termOverlay.setAttribute('aria-hidden', 'true');

  citationContainer.appendChild(toggleButton);
  citationContainer.appendChild(citationList);
  container.appendChild(citationContainer);
  container.appendChild(termOverlay);

  /**
   * Toggle citation visibility
   */
  function toggle() {
    visible = !visible;
    toggleButton.setAttribute('aria-pressed', visible.toString());
    citationList.setAttribute('aria-hidden', (!visible).toString());
    citationContainer.classList.toggle('citations-visible', visible);
    render();
  }

  /**
   * Show citations for current context
   * @param {string[]} citationIds
   */
  function showCitations(citationIds) {
    activeCitations = citationIds.filter(id => citationMap.has(id));
    render();
  }

  /**
   * Clear active citations
   */
  function clearCitations() {
    activeCitations = [];
    render();
  }

  /**
   * Render citation list
   */
  function render() {
    if (!visible || activeCitations.length === 0) {
      citationList.innerHTML = `
        <div class="citation-empty">
          ${visible ? 'No citations for this scene' : ''}
        </div>
      `;
      return;
    }

    const citationHtml = activeCitations
      .map(id => {
        const citation = citationMap.get(id);
        if (!citation) {
          return '';
        }

        return `
          <div class="citation-item" data-citation-id="${citation.id}">
            <div class="citation-header">
              <span class="citation-rfc">RFC ${citation.rfc}</span>
              <span class="citation-section">Section ${citation.section}</span>
            </div>
            <div class="citation-title">${escapeHtml(citation.title)}</div>
            <div class="citation-claim">${escapeHtml(citation.claim)}</div>
            ${
              citation.quote
                ? `
              <blockquote class="citation-quote">
                "${escapeHtml(citation.quote)}"
              </blockquote>
            `
                : ''
            }
            <a href="${citation.url}" target="_blank" rel="noopener noreferrer" class="citation-link">
              View in RFC Editor
            </a>
          </div>
        `;
      })
      .join('');

    citationList.innerHTML = citationHtml;

    // Add click handlers
    citationList.querySelectorAll('.citation-item').forEach(item => {
      item.addEventListener('click', () => {
        const citationId = item.getAttribute('data-citation-id');
        if (onCitationClick && citationId) {
          onCitationClick(citationId);
        }
      });
    });
  }

  /**
   * Show a first-use term introduction
   * @param {FirstUseTerm} term
   * @returns {Promise<void>}
   */
  function showTermIntro(term) {
    return new Promise(resolve => {
      if (shownTerms.has(term.term)) {
        resolve();
        return;
      }

      shownTerms.add(term.term);

      const citation = term.citation ? citationMap.get(term.citation) : null;

      termOverlay.innerHTML = `
        <div class="term-card">
          <div class="term-header">
            <span class="term-label">New Term</span>
            <button class="term-close" aria-label="Close">&times;</button>
          </div>
          <h3 class="term-name">${escapeHtml(term.term)}</h3>
          <p class="term-definition">${escapeHtml(term.definition)}</p>
          ${
            citation
              ? `
            <div class="term-citation">
              <span class="term-citation-source">Source: RFC ${citation.rfc}, Section ${citation.section}</span>
            </div>
          `
              : ''
          }
          <button class="term-continue">Got it!</button>
        </div>
      `;

      termOverlay.setAttribute('aria-hidden', 'false');
      termOverlay.classList.add('term-overlay-visible');

      const closeBtn = termOverlay.querySelector('.term-close');
      const continueBtn = termOverlay.querySelector('.term-continue');

      const close = () => {
        termOverlay.setAttribute('aria-hidden', 'true');
        termOverlay.classList.remove('term-overlay-visible');
        resolve();
      };

      closeBtn?.addEventListener('click', close, { once: true });
      continueBtn?.addEventListener('click', close, { once: true });

      // Also close on escape key
      const handleEscape = e => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', handleEscape);
          close();
        }
      };
      document.addEventListener('keydown', handleEscape);
    });
  }

  /**
   * Show multiple term introductions sequentially
   * @param {FirstUseTerm[]} terms
   * @returns {Promise<void>}
   */
  async function showTermIntros(terms) {
    for (const term of terms) {
      await showTermIntro(term);
    }
  }

  /**
   * Check if a term has been shown
   * @param {string} termName
   * @returns {boolean}
   */
  function hasTermBeenShown(termName) {
    return shownTerms.has(termName);
  }

  /**
   * Reset shown terms (for replay)
   */
  function resetTerms() {
    shownTerms.clear();
  }

  /**
   * Create a citation badge for inline display
   * @param {string} citationId
   * @returns {HTMLElement}
   */
  function createBadge(citationId) {
    const citation = citationMap.get(citationId);
    const badge = document.createElement('span');
    badge.className = 'citation-badge';

    if (citation) {
      badge.textContent = `[RFC ${citation.rfc}]`;
      badge.setAttribute('title', `${citation.title} - ${citation.claim}`);
      badge.setAttribute('data-citation-id', citationId);
      badge.addEventListener('click', () => {
        showCitations([citationId]);
        if (!visible) {
          toggle();
        }
      });
    } else {
      badge.textContent = '[?]';
      badge.setAttribute('title', 'Citation not found');
    }

    return badge;
  }

  /**
   * Get citation by ID
   * @param {string} citationId
   * @returns {Citation|undefined}
   */
  function getCitation(citationId) {
    return citationMap.get(citationId);
  }

  /**
   * Check if citations are currently visible
   * @returns {boolean}
   */
  function isVisible() {
    return visible;
  }

  /**
   * Set visibility directly
   * @param {boolean} show
   */
  function setVisible(show) {
    if (visible !== show) {
      toggle();
    }
  }

  /**
   * Destroy component and clean up
   */
  function destroy() {
    citationContainer.remove();
    termOverlay.remove();
  }

  // Set up toggle button click handler
  toggleButton.addEventListener('click', toggle);

  // Initial render
  render();

  return {
    toggle,
    showCitations,
    clearCitations,
    showTermIntro,
    showTermIntros,
    hasTermBeenShown,
    resetTerms,
    createBadge,
    getCitation,
    isVisible,
    setVisible,
    destroy,
  };
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Load citations from JSON file
 * @param {string} path
 * @returns {Promise<Citation[]>}
 */
export async function loadCitations(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load citations: ${response.status}`);
  }
  const data = await response.json();
  return data.citations || [];
}
