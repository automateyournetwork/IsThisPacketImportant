#!/usr/bin/env node

/**
 * Generate Images Script
 *
 * Generates game images using Nano Banana (Gemini) or OpenAI DALL-E.
 * Supports idempotent regeneration via checksum comparison.
 *
 * Usage: node scripts/gen-images.js [--force]
 *
 * @module gen-images
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// API Keys from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

// Parse command line arguments
const args = process.argv.slice(2);
const forceRegenerate = args.includes('--force');

/**
 * Image generation request
 * @typedef {Object} ImageRequest
 * @property {string} id - Unique identifier
 * @property {string} prompt - Generation prompt
 * @property {string} outputPath - Output file path (relative to PROJECT_ROOT)
 * @property {string} [provider] - 'openai' or 'gemini'
 * @property {string} [size] - Image size
 * @property {string} [style] - Style setting
 */

/**
 * Image generation definitions
 */
const IMAGE_DEFINITIONS = [
  {
    id: 'logo',
    prompt:
      'Is This Packet Important? game logo, neon cyan text on dark background, retro-futuristic network theme, clean vector style',
    outputPath: 'assets/images/ui/logo.png',
    provider: 'openai',
    size: '1792x1024',
  },
  {
    id: 'debrief-bg',
    prompt:
      'Dark data center control room background, holographic displays, neon accents, cyberpunk aesthetic, 1920x1080, cinematic',
    outputPath: 'assets/images/ui/debrief-bg.png',
    provider: 'openai',
    size: '1792x1024',
  },
  {
    id: 'mentor-portrait',
    prompt:
      'Wise holographic mentor character portrait, circuit pattern details, cyan glow, smart glasses with data display, friendly, sci-fi style, 512x512',
    outputPath: 'assets/images/characters/mentor.png',
    provider: 'openai',
    size: '1024x1024',
  },
  {
    id: 'router-portrait',
    prompt:
      'Personified network router character, central glowing eye, mechanical features, stressed expression, data center background, 512x512',
    outputPath: 'assets/images/characters/router.png',
    provider: 'openai',
    size: '1024x1024',
  },
  {
    id: 'packet-ef',
    prompt:
      'Glowing red-orange hexagonal data packet icon, digital circuit patterns, urgent pulsing energy, dark background, 256x256',
    outputPath: 'assets/images/packets/packet-ef.png',
    provider: 'openai',
    size: '1024x1024',
  },
  {
    id: 'packet-af',
    prompt:
      'Glowing cyan-teal hexagonal data packet icon, digital circuit patterns, steady energy, dark background, 256x256',
    outputPath: 'assets/images/packets/packet-af.png',
    provider: 'openai',
    size: '1024x1024',
  },
  {
    id: 'packet-be',
    prompt:
      'Glowing white-neutral hexagonal data packet icon, minimal circuit patterns, calm energy, dark background, 256x256',
    outputPath: 'assets/images/packets/packet-be.png',
    provider: 'openai',
    size: '1024x1024',
  },
  {
    id: 'packet-cs1',
    prompt:
      'Dim gray-blue hexagonal data packet icon, faded circuit patterns, low energy, dark background, 256x256',
    outputPath: 'assets/images/packets/packet-cs1.png',
    provider: 'openai',
    size: '1024x1024',
  },
];

/**
 * Load existing manifest
 * @returns {Promise<Object>}
 */
async function loadManifest() {
  const manifestPath = path.join(PROJECT_ROOT, 'assets', 'manifest.json');

  if (!existsSync(manifestPath)) {
    return { version: '1.0.0', images: [] };
  }

  const content = await readFile(manifestPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Save manifest
 * @param {Object} manifest
 */
async function saveManifest(manifest) {
  const manifestPath = path.join(PROJECT_ROOT, 'assets', 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

/**
 * Calculate checksum of prompt (for idempotency)
 * @param {string} prompt
 * @returns {string}
 */
function promptChecksum(prompt) {
  return createHash('sha256').update(prompt).digest('hex').substring(0, 16);
}

/**
 * Generate image using OpenAI DALL-E
 * @param {ImageRequest} request
 * @returns {Promise<Buffer>}
 */
async function generateWithOpenAI(request) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }

  // Call DALL-E 3 API
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: request.prompt,
      n: 1,
      size: request.size || '1024x1024',
      quality: 'hd',
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const base64Image = data.data[0].b64_json;
  return Buffer.from(base64Image, 'base64');
}

/**
 * Generate image using Nano Banana (Gemini)
 * @param {ImageRequest} request
 * @returns {Promise<Buffer>}
 */
async function generateWithGemini(request) {
  if (!GOOGLE_AI_API_KEY) {
    throw new Error('GOOGLE_AI_API_KEY not set');
  }

  // TODO: Implement actual Gemini API call
  console.log(`  [STUB] Would call Gemini Imagen API`);
  console.log(`  Prompt: "${request.prompt.substring(0, 80)}..."`);

  // Return placeholder
  return Buffer.from('PLACEHOLDER_IMAGE_DATA');
}

/**
 * Generate a single image
 * @param {ImageRequest} request
 * @param {Object} manifest - Current manifest
 * @returns {Promise<Object>} Updated manifest entry
 */
async function generateImage(request, manifest) {
  const checksum = promptChecksum(request.prompt);
  const outputPath = path.join(PROJECT_ROOT, request.outputPath);

  // Check if already generated with same prompt
  const existing = manifest.images?.find(i => i.id === request.id);
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
    let imageData;
    if (request.provider === 'gemini') {
      imageData = await generateWithGemini(request);
    } else {
      imageData = await generateWithOpenAI(request);
    }

    // Write image file
    await writeFile(outputPath, imageData);

    // Calculate file checksum
    const fileChecksum = createHash('sha256').update(imageData).digest('hex').substring(0, 16);

    console.log(`  Output: ${request.outputPath}`);
    console.log(`  Status: GENERATED (stub)\n`);

    return {
      id: request.id,
      prompt: request.prompt,
      promptChecksum: checksum,
      outputPath: request.outputPath,
      provider: request.provider || 'openai',
      size: request.size,
      fileChecksum,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`  Error: ${err.message}\n`);
    throw err;
  }
}

/**
 * Generate all images
 */
async function generateAllImages() {
  console.log('Image Generation Script');
  console.log('='.repeat(50));
  console.log(`Force regenerate: ${forceRegenerate}`);
  console.log(`OpenAI API Key: ${OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log(`Google AI API Key: ${GOOGLE_AI_API_KEY ? 'SET' : 'NOT SET'}`);
  console.log('');

  const manifest = await loadManifest();
  const newImages = [];

  for (const def of IMAGE_DEFINITIONS) {
    try {
      const entry = await generateImage(def, manifest);
      newImages.push(entry);
    } catch (err) {
      console.error(`Failed to generate ${def.id}:`, err.message);
      // Keep existing entry if generation fails
      const existing = manifest.images?.find(i => i.id === def.id);
      if (existing) {
        newImages.push(existing);
      }
    }
  }

  // Update manifest
  manifest.images = newImages;
  manifest.lastGenerated = new Date().toISOString();
  await saveManifest(manifest);

  console.log('='.repeat(50));
  console.log(`Generated: ${newImages.length} images`);
  console.log(`Manifest updated: assets/manifest.json`);
}

// Run if called directly
generateAllImages().catch(err => {
  console.error('Image generation failed:', err);
  process.exit(1);
});
