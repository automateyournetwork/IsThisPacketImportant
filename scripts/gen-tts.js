#!/usr/bin/env node

/**
 * Generate TTS Script
 *
 * Generates voice-over audio using OpenAI TTS API.
 * Supports idempotent regeneration via checksum comparison.
 *
 * Usage: node scripts/gen-tts.js [--force]
 *
 * @module gen-tts
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// API Key from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force');

/**
 * TTS generation request
 * @typedef {Object} TTSRequest
 * @property {string} id - Unique identifier
 * @property {string} text - Text to speak
 * @property {string} voice - OpenAI voice ID
 * @property {string} outputPath - Output file path
 * @property {number} [speed] - Speaking speed (0.25-4.0)
 */

/**
 * Voice line definitions
 * These are derived from voice-config.json character profiles
 */
const VOICE_LINES = [
  // Narrator - Intro
  {
    id: 'intro-01',
    text: "It's 5pm. Rush hour. And you're the traffic controller for Router 7.",
    voice: 'onyx',
    speed: 0.95,
    outputPath: 'audio/voice/level-01/intro-01.mp3',
  },
  {
    id: 'intro-02',
    text: 'Packets are flooding in from every direction. Some are critical. Some are... not.',
    voice: 'onyx',
    speed: 0.95,
    outputPath: 'audio/voice/level-01/intro-02.mp3',
  },
  {
    id: 'intro-03',
    text: 'Your job? Classify them correctly. Send them to the right queue. Save the network.',
    voice: 'onyx',
    speed: 0.95,
    outputPath: 'audio/voice/level-01/intro-03.mp3',
  },

  // Mentor - Tutorial
  {
    id: 'mentor-welcome',
    text: "Hello! I'm Dr. Qos, and I'll be your guide through the wonderful world of DiffServ.",
    voice: 'alloy',
    speed: 1.0,
    outputPath: 'audio/voice/level-01/mentor-welcome.mp3',
  },
  {
    id: 'mentor-dscp-intro',
    text: 'Every packet has a DSCP field - a 6-bit code that tells routers how important it is.',
    voice: 'alloy',
    speed: 1.0,
    outputPath: 'audio/voice/level-01/mentor-dscp-intro.mp3',
  },
  {
    id: 'mentor-ef-explain',
    text: 'EF, Expedited Forwarding, is the VIP lane. Low latency, low jitter. Perfect for voice calls.',
    voice: 'alloy',
    speed: 1.0,
    outputPath: 'audio/voice/level-01/mentor-ef-explain.mp3',
  },

  // Emergency Dispatcher
  {
    id: 'emergency-01',
    text: 'This is 911 dispatch! We need this call to go through NOW!',
    voice: 'nova',
    speed: 1.2,
    outputPath: 'audio/voice/level-01/emergency-01.mp3',
  },
  {
    id: 'emergency-02',
    text: 'Lives are on the line! Priority routing, please!',
    voice: 'nova',
    speed: 1.2,
    outputPath: 'audio/voice/level-01/emergency-02.mp3',
  },

  // CEO
  {
    id: 'ceo-01',
    text: 'The shareholders are watching. This presentation cannot buffer.',
    voice: 'fable',
    speed: 0.95,
    outputPath: 'audio/voice/level-01/ceo-01.mp3',
  },
  {
    id: 'ceo-02',
    text: 'Real-time video. No excuses.',
    voice: 'fable',
    speed: 0.95,
    outputPath: 'audio/voice/level-01/ceo-02.mp3',
  },

  // Backup Bot
  {
    id: 'backup-01',
    text: 'Initiating nightly backup sequence. Estimated data: 2.7 terabytes.',
    voice: 'echo',
    speed: 0.9,
    outputPath: 'audio/voice/level-01/backup-01.mp3',
  },
  {
    id: 'backup-02',
    text: 'Priority level: standard. Completion time: flexible.',
    voice: 'echo',
    speed: 0.9,
    outputPath: 'audio/voice/level-01/backup-02.mp3',
  },

  // Email Client
  {
    id: 'email-01',
    text: "Just syncing some emails here. Nothing urgent. Whenever you're ready.",
    voice: 'shimmer',
    speed: 1.0,
    outputPath: 'audio/voice/level-01/email-01.mp3',
  },

  // P2P Swarm
  {
    id: 'torrent-01',
    text: 'Hey! I need ALL the bandwidth! This update is 50 gigabytes!',
    voice: 'alloy',
    speed: 1.3,
    outputPath: 'audio/voice/level-01/torrent-01.mp3',
  },
  {
    id: 'torrent-02',
    text: 'Come on, just let me through! Nobody else needs it right now... right?',
    voice: 'alloy',
    speed: 1.3,
    outputPath: 'audio/voice/level-01/torrent-02.mp3',
  },

  // Router
  {
    id: 'router-stress-01',
    text: 'Warning! Queue utilization at 87%. Classification needed.',
    voice: 'onyx',
    speed: 1.1,
    outputPath: 'audio/voice/level-01/router-stress-01.mp3',
  },
  {
    id: 'router-success',
    text: 'Excellent routing decision. Traffic flowing smoothly.',
    voice: 'onyx',
    speed: 1.1,
    outputPath: 'audio/voice/level-01/router-success.mp3',
  },
  {
    id: 'router-failure',
    text: 'Misclassification detected. Network congestion increasing.',
    voice: 'onyx',
    speed: 1.1,
    outputPath: 'audio/voice/level-01/router-failure.mp3',
  },
];

/**
 * Load existing manifest
 * @returns {Promise<Object>}
 */
async function loadManifest() {
  const manifestPath = path.join(PROJECT_ROOT, 'audio', 'manifest.json');

  if (!existsSync(manifestPath)) {
    return { version: '1.0.0', voiceLines: [] };
  }

  const content = await readFile(manifestPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save manifest
 * @param {Object} manifest
 */
async function saveManifest(manifest) {
  const manifestPath = path.join(PROJECT_ROOT, 'audio', 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

/**
 * Calculate checksum of text
 * @param {string} text
 * @returns {string}
 */
function textChecksum(text) {
  return createHash('sha256').update(text).digest('hex').substring(0, 16);
}

/**
 * Generate audio using OpenAI TTS
 * @param {TTSRequest} request
 * @returns {Promise<Buffer>}
 */
async function generateWithOpenAI(request) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1-hd',
      input: request.text,
      voice: request.voice,
      speed: request.speed || 1.0,
      response_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a single voice line
 * @param {TTSRequest} request
 * @param {Object} manifest
 * @returns {Promise<Object>}
 */
async function generateVoiceLine(request, manifest) {
  const checksum = textChecksum(request.text);
  const outputPath = path.join(PROJECT_ROOT, request.outputPath);

  // Check if already generated with same text
  const existing = manifest.voiceLines?.find(v => v.id === request.id);
  if (
    existing &&
    existing.textChecksum === checksum &&
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
    const audioData = await generateWithOpenAI(request);

    // Write audio file
    await writeFile(outputPath, audioData);

    // Calculate file checksum
    const fileChecksum = createHash('sha256').update(audioData).digest('hex').substring(0, 16);

    console.log(`  Output: ${request.outputPath}`);
    console.log(`  Status: GENERATED (stub)\n`);

    return {
      id: request.id,
      text: request.text,
      textChecksum: checksum,
      voice: request.voice,
      speed: request.speed || 1.0,
      outputPath: request.outputPath,
      fileChecksum,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`  Error: ${err.message}\n`);
    throw err;
  }
}

/**
 * Generate all voice lines
 */
async function generateAllVoiceLines() {
  console.log('TTS Generation Script');
  console.log('='.repeat(50));
  console.log(`Force regenerate: ${forceRegenerate}`);
  console.log(`OpenAI API Key: ${OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log('');

  const manifest = await loadManifest();
  const newVoiceLines = [];

  for (const line of VOICE_LINES) {
    try {
      const entry = await generateVoiceLine(line, manifest);
      newVoiceLines.push(entry);
    } catch (err) {
      console.error(`Failed to generate ${line.id}:`, err.message);
      // Keep existing entry if generation fails
      const existing = manifest.voiceLines?.find(v => v.id === line.id);
      if (existing) {
        newVoiceLines.push(existing);
      }
    }
  }

  // Update manifest
  manifest.voiceLines = newVoiceLines;
  manifest.lastGenerated = new Date().toISOString();
  await saveManifest(manifest);

  console.log('='.repeat(50));
  console.log(`Generated: ${newVoiceLines.length} voice lines`);
  console.log(`Manifest updated: audio/manifest.json`);
}

// Run if called directly
generateAllVoiceLines().catch(err => {
  console.error('TTS generation failed:', err);
  process.exit(1);
});
