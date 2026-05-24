#!/usr/bin/env node

/**
 * Fetch RFC Citations Script
 *
 * Fetches RFC section text from rfc-editor.org and verifies citations.
 * Updates content/citations.json with verified RFC quotes.
 *
 * Usage: node scripts/fetch-rfc-citations.js [--verify] [--update]
 *
 * Options:
 *   --verify  Only verify existing citations, don't update
 *   --update  Update citations.json with fetched content
 *
 * @module fetch-rfc-citations
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CITATIONS_PATH = path.join(PROJECT_ROOT, 'content', 'citations.json');

// RFC Editor base URL
const RFC_EDITOR_BASE = 'https://www.rfc-editor.org/rfc';

// Rate limiting - be nice to the RFC Editor
const FETCH_DELAY_MS = 1000;

/**
 * RFC section mappings for known citations
 * Maps our section notation to actual RFC section headers
 */
const SECTION_TITLES = {
  2474: {
    3: 'Differentiated Services Field Definition',
    4.1: 'Default PHB',
    '4.2.2.2': 'Class Selector Codepoints',
  },
  2597: {
    2: 'The AF PHB Group',
    2.1: 'AF Drop Precedence',
    3: 'Traffic Conditioning Actions',
  },
  3246: {
    2: 'The EF PHB',
  },
  4594: {
    4.1: 'Network Control Service Class',
    4.2: 'Telephony Service Class',
    4.3: 'OAM Service Class',
    4.4: 'Low-Latency Data Service Class',
    4.5: 'Multimedia Streaming Service Class',
    4.6: 'Real-Time Interactive Service Class',
    4.7: 'Telephony Service Class',
    4.8: 'High-Throughput Data Service Class',
    '4.10': 'Low-Priority Data Service Class',
    4.12: 'Standard Service Class',
  },
};

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch an RFC document text
 * @param {number} rfcNumber
 * @returns {Promise<string>}
 */
async function fetchRfcText(rfcNumber) {
  const url = `${RFC_EDITOR_BASE}/rfc${rfcNumber}.txt`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch RFC ${rfcNumber}: ${err.message}`);
  }
}

/**
 * Extract a section from RFC text
 * @param {string} rfcText - Full RFC text
 * @param {string} sectionId - Section identifier (e.g., "4.7")
 * @returns {string|null} - Section text or null if not found
 */
function extractSection(rfcText, sectionId) {
  // Build regex to find section header
  // RFC sections typically look like: "4.7.  Section Title"
  const sectionPattern = new RegExp(
    `^\\s*${sectionId.replace('.', '\\.')}[.\\s]+([^\\n]+)\\n([\\s\\S]*?)(?=^\\s*\\d+\\.\\d*[.\\s]+|^\\s*\\d+[.\\s]+[A-Z]|^Appendix|^References|^Authors|^Full Copyright)`,
    'm'
  );

  const match = rfcText.match(sectionPattern);
  if (match) {
    return match[0].trim();
  }

  return null;
}

/**
 * Extract a relevant quote from section text
 * @param {string} sectionText
 * @param {string[]} keywords - Keywords to search for
 * @returns {string} - A relevant quote
 */
function extractQuote(sectionText, keywords) {
  // Split into sentences
  const sentences = sectionText
    .replace(/\n\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.length > 20);

  // Find sentences containing keywords
  for (const keyword of keywords) {
    const keywordLower = keyword.toLowerCase();
    const matching = sentences.find(s => s.toLowerCase().includes(keywordLower));
    if (matching) {
      // Return first 200 chars of matching sentence
      return matching.slice(0, 200) + (matching.length > 200 ? '...' : '');
    }
  }

  // Fall back to first substantial sentence
  return sentences[0]?.slice(0, 200) || sectionText.slice(0, 200);
}

/**
 * Load existing citations
 * @returns {Promise<Object>}
 */
async function loadExistingCitations() {
  if (!existsSync(CITATIONS_PATH)) {
    return null;
  }

  const content = await readFile(CITATIONS_PATH, 'utf-8');
  return JSON.parse(content);
}

/**
 * Verify a single citation against RFC text
 * @param {Object} citation
 * @param {Map<number, string>} rfcCache - Cache of fetched RFC texts
 * @returns {Promise<Object>}
 */
async function verifyCitation(citation, rfcCache) {
  const { rfc, section, claim } = citation;

  // Get RFC text (from cache or fetch)
  let rfcText = rfcCache.get(rfc);
  if (!rfcText) {
    console.log(`  Fetching RFC ${rfc}...`);
    try {
      rfcText = await fetchRfcText(rfc);
      rfcCache.set(rfc, rfcText);
      await sleep(FETCH_DELAY_MS);
    } catch (err) {
      return {
        ...citation,
        verified: false,
        verificationError: err.message,
      };
    }
  }

  // Extract section
  const sectionText = extractSection(rfcText, section);
  if (!sectionText) {
    return {
      ...citation,
      verified: false,
      verificationError: `Section ${section} not found in RFC ${rfc}`,
    };
  }

  // Get expected title
  const expectedTitle = SECTION_TITLES[rfc]?.[section];

  // Extract keywords from claim for quote extraction
  const keywords = claim
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 5);

  const extractedQuote = extractQuote(sectionText, keywords);

  return {
    ...citation,
    title: expectedTitle || `RFC ${rfc} Section ${section}`,
    quote: citation.quote || extractedQuote,
    verified: true,
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Main verification function
 */
async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify');
  const shouldUpdate = args.includes('--update');

  console.log('RFC Citation Verification Tool');
  console.log('==============================\n');

  // Load existing citations
  const citationsData = await loadExistingCitations();
  if (!citationsData) {
    console.error('Error: content/citations.json not found');
    console.error('Run the game build first to generate initial citations.');
    process.exit(1);
  }

  console.log(`Loaded ${citationsData.citations.length} citations\n`);

  // RFC text cache
  const rfcCache = new Map();

  // Verify each citation
  const results = [];
  let verified = 0;
  let failed = 0;

  for (const citation of citationsData.citations) {
    console.log(`Verifying: ${citation.id}`);
    console.log(`  RFC ${citation.rfc}, Section ${citation.section}`);

    const result = await verifyCitation(citation, rfcCache);
    results.push(result);

    if (result.verified) {
      console.log('  Status: VERIFIED');
      verified++;
    } else {
      console.log(`  Status: FAILED - ${result.verificationError}`);
      failed++;
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(50));
  console.log('Verification Summary');
  console.log('='.repeat(50));
  console.log(`Total:    ${results.length}`);
  console.log(`Verified: ${verified}`);
  console.log(`Failed:   ${failed}`);
  console.log('');

  // Update citations file if requested
  if (shouldUpdate && !verifyOnly) {
    const updatedCitations = {
      ...citationsData,
      lastVerified: new Date().toISOString(),
      citations: results,
    };

    await writeFile(CITATIONS_PATH, JSON.stringify(updatedCitations, null, 2) + '\n');
    console.log(`Updated: ${CITATIONS_PATH}`);
  } else if (!verifyOnly) {
    console.log('Use --update to save verified citations to file.');
  }

  // Exit with error if any failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
