#!/usr/bin/env node

/**
 * Generate Placeholder Videos Script
 *
 * Creates minimal placeholder MP4 files for development.
 * Uses ffmpeg if available, otherwise creates empty files.
 *
 * Usage: node scripts/gen-placeholder-videos.js
 */

import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const CUTSCENE_DIR = path.join(PROJECT_ROOT, 'cutscenes', 'level-01');

// All video files needed for level-01
const VIDEO_FILES = [
  // Intro/Outro
  'intro.mp4',
  'outro.mp4',

  // Vignette 01 - VoIP Emergency
  'v01-intro.mp4',
  'v01-success.mp4',
  'v01-failure.mp4',
  'v01-retry-intro.mp4',

  // Vignette 02 - Video Conference
  'v02-intro.mp4',
  'v02-success.mp4',
  'v02-failure.mp4',
  'v02-fail-intro.mp4',

  // Vignette 03 - Backup Transfer
  'v03-intro.mp4',
  'v03-success.mp4',
  'v03-failure.mp4',
  'v03-fail-intro.mp4',

  // Vignette 04 - Email
  'v04-intro.mp4',
  'v04-success.mp4',
  'v04-failure.mp4',
  'v04-fail-intro.mp4',

  // Vignette 05 - P2P
  'v05-intro.mp4',
  'v05-success.mp4',
  'v05-failure.mp4',
  'v05-fail-intro.mp4',

  // Boss Event
  'boss-intro.mp4',
  'boss-01.mp4',
  'boss-01-success.mp4',
  'boss-01-failure.mp4',
  'boss-02.mp4',
  'boss-02-success.mp4',
  'boss-02-failure.mp4',
  'boss-03.mp4',
  'boss-03-success.mp4',
  'boss-03-failure.mp4',
  'boss-04.mp4',
  'boss-04-success.mp4',
  'boss-04-failure.mp4',
  'boss-05.mp4',
  'boss-05-success.mp4',
  'boss-05-failure.mp4',
];

/**
 * Check if ffmpeg is available
 */
function hasFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Create a minimal placeholder video with ffmpeg
 */
function createVideoWithFFmpeg(outputPath, duration = 2, color = '0x0a0a1a') {
  const cmd = `ffmpeg -y -f lavfi -i color=c=${color}:s=1920x1080:d=${duration} -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -c:v libx264 -preset ultrafast -crf 30 -c:a aac -b:a 64k "${outputPath}" 2>/dev/null`;
  try {
    execSync(cmd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create an empty placeholder file
 */
async function createEmptyFile(outputPath) {
  // Create minimal MP4 header (not a valid video, but indicates intent)
  const header = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x20, // Size
    0x66,
    0x74,
    0x79,
    0x70, // 'ftyp'
    0x69,
    0x73,
    0x6f,
    0x6d, // 'isom'
    0x00,
    0x00,
    0x02,
    0x00, // Minor version
    0x69,
    0x73,
    0x6f,
    0x6d, // Compatible brands
    0x69,
    0x73,
    0x6f,
    0x32,
    0x61,
    0x76,
    0x63,
    0x31,
    0x6d,
    0x70,
    0x34,
    0x31,
  ]);
  await writeFile(outputPath, header);
}

/**
 * Main generation function
 */
async function generatePlaceholders() {
  console.log('Generating placeholder videos for development...\n');

  // Ensure directory exists
  if (!existsSync(CUTSCENE_DIR)) {
    await mkdir(CUTSCENE_DIR, { recursive: true });
  }

  const useFFmpeg = hasFFmpeg();
  console.log(`FFmpeg available: ${useFFmpeg ? 'Yes' : 'No'}`);

  if (!useFFmpeg) {
    console.log('Creating minimal placeholder files (not playable)');
    console.log('Install ffmpeg for actual placeholder videos\n');
  }

  let created = 0;
  let skipped = 0;

  for (const filename of VIDEO_FILES) {
    const outputPath = path.join(CUTSCENE_DIR, filename);

    if (existsSync(outputPath)) {
      console.log(`  Skip: ${filename} (exists)`);
      skipped++;
      continue;
    }

    // Determine duration and color based on type
    let duration = 3;
    let color = '0x0a0a1a'; // Dark background

    if (filename.includes('intro') && !filename.includes('boss')) {
      duration = 5;
    } else if (filename.includes('success')) {
      color = '0x00d4aa'; // Green tint
      duration = 2;
    } else if (filename.includes('failure')) {
      color = '0xff4444'; // Red tint
      duration = 2;
    } else if (filename.includes('boss')) {
      duration = 2;
      color = '0xffaa00'; // Orange tint for boss
    }

    if (useFFmpeg) {
      const success = createVideoWithFFmpeg(outputPath, duration, color);
      if (success) {
        console.log(`  Created: ${filename} (${duration}s, ffmpeg)`);
        created++;
      } else {
        await createEmptyFile(outputPath);
        console.log(`  Created: ${filename} (empty fallback)`);
        created++;
      }
    } else {
      await createEmptyFile(outputPath);
      console.log(`  Created: ${filename} (placeholder)`);
      created++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Created: ${created} files`);
  console.log(`Skipped: ${skipped} files (already exist)`);
  console.log(`Total expected: ${VIDEO_FILES.length} files`);

  if (!useFFmpeg) {
    console.log('\nNote: Placeholder files are not playable.');
    console.log('Run `npm run gen-cutscenes` with Veo3 API key for real videos.');
  }
}

generatePlaceholders().catch(console.error);
