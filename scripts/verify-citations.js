#!/usr/bin/env node

/**
 * Verify Citations Script
 *
 * Verifies that all citations in citations.json are still valid
 * by re-fetching from RFC Editor and comparing.
 *
 * Used in CI to detect RFC drift.
 *
 * Usage: node scripts/verify-citations.js [options]
 *
 * Options:
 *   --strict    Fail on any drift or errors (default: only fail on errors)
 *   --ci        CI mode with minimal output
 *   --dry-run   Show what would be verified without fetching
 *   --verbose   Show detailed output even in CI mode
 *
 * Exit codes:
 *   0 - All citations verified (or only skipped)
 *   1 - Errors occurred (or drift in strict mode)
 *
 * @module verify-citations
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// RFC MCP Server configuration (reserved for future MCP integration)
// const RFC_MCP_URL = process.env.RFC_MCP_SERVER_URL || 'http://localhost:3000';

// Parse command line arguments
const args = process.argv.slice(2);
const strictMode = args.includes('--strict');
const ciMode = args.includes('--ci');
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

// In CI mode, minimize output unless there are issues
const log = msg => {
  if (!ciMode || verbose) {
    console.log(msg);
  }
};

/**
 * Load existing citations
 * @returns {Promise<Object>}
 */
async function loadCitations() {
  const citationsPath = path.join(PROJECT_ROOT, 'content', 'citations.json');

  if (!existsSync(citationsPath)) {
    throw new Error(`Citations file not found: ${citationsPath}`);
  }

  const content = await readFile(citationsPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Fetch a section from an RFC via RFC Editor
 * @param {number} rfcNumber - RFC number
 * @param {string} section - Section identifier
 * @returns {Promise<Object>}
 */
async function fetchRfcSection(rfcNumber, section) {
  const url = `https://www.rfc-editor.org/rfc/rfc${rfcNumber}.txt`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`RFC ${rfcNumber} not found: ${response.status}`);
    }

    const text = await response.text();

    // Extract section content
    const sectionContent = extractSection(text, section);

    console.log(`  Fetched RFC ${rfcNumber} Section ${section}`);

    return {
      rfc: rfcNumber,
      section,
      excerpt: sectionContent.substring(0, 500),
      fullContent: sectionContent,
    };
  } catch (err) {
    console.log(`  Failed to fetch RFC ${rfcNumber}: ${err.message}`);
    throw err;
  }
}

/**
 * Extract a section from RFC text
 * @param {string} text - Full RFC text
 * @param {string} sectionId - Section identifier (e.g., "4.7", "3.1")
 * @returns {string}
 */
function extractSection(text, sectionId) {
  // RFC section patterns: "X.Y.  Title" or "X.Y Title"
  const sectionPattern = new RegExp(`^${sectionId.replace('.', '\\.')}[.\\s]+[A-Z]`, 'm');
  const nextSectionPattern = /^\d+(\.\d+)*[.\s]+[A-Z]/m;

  const startMatch = text.match(sectionPattern);
  if (!startMatch) {
    return `[Section ${sectionId} not found in RFC text]`;
  }

  const startIndex = startMatch.index;
  const afterStart = text.substring(startIndex + 10);
  const nextMatch = afterStart.match(nextSectionPattern);

  const endIndex = nextMatch
    ? startIndex + 10 + nextMatch.index
    : Math.min(startIndex + 5000, text.length);

  return text.substring(startIndex, endIndex).trim();
}

/**
 * Normalize text for comparison
 * @param {string} text
 * @returns {string}
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Compare two excerpts for significant changes
 * @param {string} stored - Stored excerpt
 * @param {string} fetched - Freshly fetched excerpt
 * @returns {boolean} True if they match (or close enough)
 */
function compareExcerpts(stored, fetched) {
  // Skip verification for stubs or failed fetches
  if (stored.includes('[Placeholder') || stored.includes('[Fetch failed')) {
    return true;
  }

  if (fetched.includes('[Section') && fetched.includes('not found')) {
    // Section not found in RFC - this is a drift
    return false;
  }

  // Normalize both texts for comparison
  const normalizedStored = normalizeText(stored);
  const normalizedFetched = normalizeText(fetched);

  // Check if the stored excerpt key phrases exist in fetched content
  // We extract significant words (4+ chars) from stored excerpt
  const storedWords = normalizedStored.split(' ').filter(w => w.length >= 4);
  const uniqueWords = [...new Set(storedWords)].slice(0, 20); // First 20 unique significant words

  // Count how many key words appear in the fetched content
  let matches = 0;
  for (const word of uniqueWords) {
    if (normalizedFetched.includes(word)) {
      matches++;
    }
  }

  // Require at least 60% of key words to match
  const matchRatio = matches / uniqueWords.length;
  return matchRatio >= 0.6;
}

/**
 * Verify all citations
 * @param {Object} citations - Citations data
 * @returns {Promise<Object>} Verification results
 */
async function verifyCitations(citations) {
  log('Verifying RFC citations...\n');

  const results = {
    total: 0,
    verified: 0,
    drifted: 0,
    skipped: 0,
    errors: 0,
    details: [],
  };

  for (const citation of citations.citations) {
    results.total++;

    log(`Verifying: ${citation.id}`);
    log(`  RFC ${citation.rfc} Section ${citation.section}`);

    // Skip unverified stubs
    if (!citation.verified) {
      log(`  Status: SKIPPED (not yet verified)\n`);
      results.skipped++;
      results.details.push({
        id: citation.id,
        status: 'skipped',
        reason: 'Not yet verified from RFC MCP server',
      });
      continue;
    }

    // Dry run mode - don't actually fetch
    if (dryRun) {
      log(`  Status: DRY RUN (would verify)\n`);
      results.skipped++;
      results.details.push({
        id: citation.id,
        status: 'skipped',
        reason: 'Dry run mode',
      });
      continue;
    }

    try {
      const rfcData = await fetchRfcSection(citation.rfc, citation.section);

      if (compareExcerpts(citation.excerpt, rfcData.excerpt)) {
        log(`  Status: VERIFIED\n`);
        results.verified++;
        results.details.push({
          id: citation.id,
          status: 'verified',
        });
      } else {
        // Always show drifted citations, even in CI mode
        console.log(`  Status: DRIFTED (RFC content may have changed)`);
        console.log(`    Citation: ${citation.id}`);
        results.drifted++;
        results.details.push({
          id: citation.id,
          status: 'drifted',
          stored: citation.excerpt.substring(0, 100),
          fetched: rfcData.excerpt.substring(0, 100),
        });
      }
    } catch (err) {
      // Always show errors, even in CI mode
      console.log(`  Status: ERROR (${err.message})`);
      console.log(`    Citation: ${citation.id}`);
      results.errors++;
      results.details.push({
        id: citation.id,
        status: 'error',
        error: err.message,
      });
    }
  }

  return results;
}

/**
 * Print verification summary
 * @param {Object} results - Verification results
 */
function printSummary(results) {
  // Always print summary, even in CI mode
  console.log('='.repeat(50));
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total citations: ${results.total}`);
  console.log(`Verified:        ${results.verified}`);
  console.log(`Skipped:         ${results.skipped}`);
  console.log(`Drifted:         ${results.drifted}`);
  console.log(`Errors:          ${results.errors}`);
  console.log('');

  if (results.drifted > 0) {
    console.log('DRIFTED CITATIONS:');
    for (const detail of results.details.filter(d => d.status === 'drifted')) {
      console.log(`  - ${detail.id}`);
    }
    console.log('');
    console.log('RFC content may have been updated. Human review required.');
    console.log('Run `npm run fetch-citations` to update after review.');
  }

  if (results.errors > 0) {
    console.log('ERRORS:');
    for (const detail of results.details.filter(d => d.status === 'error')) {
      console.log(`  - ${detail.id}: ${detail.error}`);
    }
  }

  // CI-friendly one-liner at end
  if (ciMode) {
    const status = results.drifted > 0 || results.errors > 0 ? 'FAILED' : 'PASSED';
    console.log(`\n::${status.toLowerCase()}::Citation verification ${status}`);
  }
}

/**
 * Main verification routine
 */
async function main() {
  try {
    const citations = await loadCitations();
    const results = await verifyCitations(citations);

    printSummary(results);

    // Exit code based on results
    if (strictMode) {
      // Strict mode: fail on any drift or errors
      if (results.drifted > 0 || results.errors > 0) {
        console.log('\nSTRICT MODE: Failing due to drift or errors');
        process.exit(1);
      }
    } else {
      // Normal mode: only fail on errors
      if (results.errors > 0) {
        process.exit(1);
      }
    }

    console.log('\nVerification complete.');
  } catch (err) {
    console.error('Verification failed:', err.message);
    process.exit(1);
  }
}

main();
