#!/usr/bin/env node

/**
 * Generate Cutscenes Script
 *
 * Generates cutscene videos using Veo3 API.
 * Supports idempotent regeneration via checksum comparison.
 *
 * Usage: node scripts/gen-cutscenes.js [--force]
 *
 * @module gen-cutscenes
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// API Key from environment
const VEO_API_KEY = process.env.VEO_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force');

/**
 * Cutscene generation request
 * @typedef {Object} CutsceneRequest
 * @property {string} id - Unique identifier
 * @property {string} prompt - Generation prompt
 * @property {string} outputPath - Output file path (relative to PROJECT_ROOT)
 * @property {number} [duration] - Duration in seconds
 */

/**
 * Cutscene generation definitions
 */
const CUTSCENE_DEFINITIONS = [
  // Level 01 Intro
  {
    id: 'level-01-intro',
    prompt:
      'Camera pushes through dark data center, glowing server racks on both sides, arrives at massive glowing router junction, dramatic reveal, cyberpunk aesthetic, neon lighting, cinematic 24fps',
    outputPath: 'cutscenes/level-01/intro.mp4',
    duration: 15,
  },

  // Vignette 01 - VoIP Emergency
  {
    id: 'v01-intro',
    prompt:
      'Emergency data packet arrives urgently, red-orange glow, pulsing energy, router eye focuses, tension building, dark data center, neon highlights',
    outputPath: 'cutscenes/level-01/v01-intro.mp4',
    duration: 8,
  },
  {
    id: 'v01-success',
    prompt:
      'Data packet travels down priority lane, green success flash, router eye shows relief, satisfying whoosh, smooth camera follow',
    outputPath: 'cutscenes/level-01/v01-success.mp4',
    duration: 5,
  },
  {
    id: 'v01-failure',
    prompt:
      'Data packet stuck in wrong queue, red warning lights, router shows distress, alarm sounds, urgent mood',
    outputPath: 'cutscenes/level-01/v01-failure.mp4',
    duration: 5,
  },

  // Vignette 02 - Video Conference
  {
    id: 'v02-intro',
    prompt:
      'Corporate video stream packet arrives, cyan-teal glow, professional urgency, multiple screens visible in background',
    outputPath: 'cutscenes/level-01/v02-intro.mp4',
    duration: 8,
  },
  {
    id: 'v02-success',
    prompt:
      'Video packet flows smoothly to destination, picture perfect quality, green confirmation, celebration',
    outputPath: 'cutscenes/level-01/v02-success.mp4',
    duration: 5,
  },
  {
    id: 'v02-failure',
    prompt:
      'Video packet stutters and pixelates, frustrated faces on screens, red error indicators, disappointment',
    outputPath: 'cutscenes/level-01/v02-failure.mp4',
    duration: 5,
  },

  // Vignette 03 - Backup Transfer
  {
    id: 'v03-intro',
    prompt:
      'Large bulk data stream arrives, green glow, steady flow, database symbols, methodical movement',
    outputPath: 'cutscenes/level-01/v03-intro.mp4',
    duration: 8,
  },
  {
    id: 'v03-success',
    prompt:
      'Backup data flows to proper queue, steady progress bar, green completion indicator, satisfied',
    outputPath: 'cutscenes/level-01/v03-success.mp4',
    duration: 5,
  },
  {
    id: 'v03-failure',
    prompt:
      'Backup data clogs priority lanes, other traffic delayed, red congestion indicators, chaos',
    outputPath: 'cutscenes/level-01/v03-failure.mp4',
    duration: 5,
  },

  // Boss Event Intro
  {
    id: 'boss-intro',
    prompt:
      'Multiple packet streams flooding in simultaneously, chaotic but organized, clock ticking urgently, intense lighting, rapid-fire action, cyberpunk rush hour',
    outputPath: 'cutscenes/level-01/boss-intro.mp4',
    duration: 10,
  },

  // Outro
  {
    id: 'level-01-outro',
    prompt:
      'Router junction calms down, traffic flowing smoothly, router eye shows satisfaction, data center returns to peaceful state, triumphant music',
    outputPath: 'cutscenes/level-01/outro.mp4',
    duration: 12,
  },
];

/**
 * Load existing manifest
 * @returns {Promise<Object>}
 */
async function loadManifest() {
  const manifestPath = path.join(PROJECT_ROOT, 'cutscenes', 'manifest.json');

  if (!existsSync(manifestPath)) {
    return { version: '1.0.0', cutscenes: [] };
  }

  const content = await readFile(manifestPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save manifest
 * @param {Object} manifest
 */
async function saveManifest(manifest) {
  const manifestPath = path.join(PROJECT_ROOT, 'cutscenes', 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

/**
 * Calculate checksum of prompt
 * @param {string} prompt
 * @returns {string}
 */
function promptChecksum(prompt) {
  return createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

/**
 * Generate video using Veo3
 * @param {CutsceneRequest} request
 * @returns {Promise<Buffer>}
 */
async function generateWithVeo3(request) {
  if (!VEO_API_KEY) {
    throw new Error('VEO_API_KEY not set');
  }

  // TODO: Implement actual Veo3 API call
  console.log(`  [STUB] Would call Veo3 API`);
  console.log(`  Prompt: "${request.prompt.substring(0, 80)}..."`);
  console.log(`  Duration: ${request.duration}s`);

  // Return placeholder
  return Buffer.from('PLACEHOLDER_VIDEO_DATA');
}

/**
 * Generate a single cutscene
 * @param {CutsceneRequest} request
 * @param {Object} manifest
 * @returns {Promise<Object>}
 */
async function generateCutscene(request, manifest) {
  const checksum = promptChecksum(request.prompt);
  const outputPath = path.join(PROJECT_ROOT, request.outputPath);

  // Check if already generated with same prompt
  const existing = manifest.cutscenes?.find(c => c.id === request.id);
  if (
    existing &&
    existing.promptChecksum === checksum &&
    existsSync(outputPath) &&
    !forceRegenerate
  ) {
    console.log(`Skipping ${request.id} (already generated, checksum matches)`);
    return existing;
  }

  console.log(`Generating: ${request.id}`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  try {
    const videoData = await generateWithVeo3(request);

    // Write video file
    await writeFile(outputPath, videoData);

    // Calculate file checksum
    const fileChecksum = createHash('sha256').update(videoData).digest('hex').substring(0, 16);

    console.log(`  Output: ${request.outputPath}`);
    console.log(`  Status: GENERATED (stub)\n`);

    return {
      id: request.id,
      prompt: request.prompt,
      promptChecksum: checksum,
      outputPath: request.outputPath,
      duration: request.duration,
      fileChecksum,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`  Error: ${err.message}\n`);
    throw err;
  }
}

/**
 * Generate all cutscenes
 */
async function generateAllCutscenes() {
  console.log('Cutscene Generation Script');
  console.log('='.repeat(50));
  console.log(`Force regenerate: ${forceRegenerate}`);
  console.log(`Veo3 API Key: ${VEO_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log('');

  const manifest = await loadManifest();
  const newCutscenes = [];

  for (const def of CUTSCENE_DEFINITIONS) {
    try {
      const entry = await generateCutscene(def, manifest);
      newCutscenes.push(entry);
    } catch (err) {
      console.error(`Failed to generate ${def.id}:`, err.message);
      // Keep existing entry if generation fails
      const existing = manifest.cutscenes?.find(c => c.id === def.id);
      if (existing) {
        newCutscenes.push(existing);
      }
    }
  }

  // Update manifest
  manifest.cutscenes = newCutscenes;
  manifest.lastGenerated = new Date().toISOString();
  await saveManifest(manifest);

  console.log('='.repeat(50));
  console.log(`Generated: ${newCutscenes.length} cutscenes`);
  console.log(`Manifest updated: cutscenes/manifest.json`);
}

// Run if called directly
generateAllCutscenes().catch(err => {
  console.error('Cutscene generation failed:', err);
  process.exit(1);
});
