/**
 * Data Loader Module
 *
 * Handles loading level JSON and asset path resolution.
 * Provides centralized data access for the game.
 *
 * @module loader
 */

/**
 * @typedef {Object} LoadedAssets
 * @property {Object} level - Level data
 * @property {Object} dscpClasses - DSCP class definitions
 * @property {Object} voiceConfig - Voice configuration
 * @property {Object} citations - Citation data (if loaded)
 */

/** @type {Map<string, any>} Cache for loaded data */
const cache = new Map();

/** Base path for content files */
const CONTENT_BASE = '/content';

/** Base path for audio files */
const AUDIO_BASE = '/audio';

/**
 * Load JSON data from a URL
 * @param {string} url - URL to fetch
 * @returns {Promise<any>}
 */
async function loadJson(url) {
  // Check cache
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(url, data);
  return data;
}

/**
 * Load DSCP class definitions
 * @returns {Promise<Object>}
 */
export async function loadDscpClasses() {
  return loadJson(`${CONTENT_BASE}/dscp-classes.json`);
}

/**
 * Load a level by ID
 * @param {string} levelId - Level identifier (e.g., 'level-01')
 * @returns {Promise<Object>}
 */
export async function loadLevel(levelId) {
  return loadJson(`${CONTENT_BASE}/${levelId}.json`);
}

/**
 * Load voice configuration
 * @returns {Promise<Object>}
 */
export async function loadVoiceConfig() {
  return loadJson(`${AUDIO_BASE}/voice-config.json`);
}

/**
 * Load citations data
 * @returns {Promise<Object>}
 */
export async function loadCitations() {
  return loadJson(`${CONTENT_BASE}/citations.json`);
}

/**
 * Load dialog for a scene
 * @param {string} dialogPath - Path to dialog JSON
 * @returns {Promise<Object>}
 */
export async function loadDialog(dialogPath) {
  // dialogPath is already a full path like "content/dialog/level-01/v01.json"
  return loadJson(`/${dialogPath}`);
}

/**
 * Resolve an asset path to a full URL
 * @param {string} assetPath - Relative asset path
 * @returns {string}
 */
export function resolveAssetPath(assetPath) {
  if (assetPath.startsWith('/')) {
    return assetPath;
  }

  // Determine base path by asset type
  if (assetPath.startsWith('cutscenes/')) {
    return `/${assetPath}`;
  }
  if (assetPath.startsWith('audio/')) {
    return `/${assetPath}`;
  }
  if (assetPath.startsWith('assets/')) {
    return `/${assetPath}`;
  }
  if (assetPath.startsWith('content/')) {
    return `/${assetPath}`;
  }

  // Default: treat as relative to current path
  return assetPath;
}

/**
 * Get all video paths from a scene
 * @param {Object} scene - Scene object
 * @returns {string[]}
 */
export function getSceneVideoPaths(scene) {
  const paths = [];

  if (scene.assets) {
    if (scene.assets.intro) {
      paths.push(resolveAssetPath(scene.assets.intro));
    }
    if (scene.assets.success) {
      paths.push(resolveAssetPath(scene.assets.success));
    }
    if (scene.assets.failure) {
      paths.push(resolveAssetPath(scene.assets.failure));
    }
  }

  return paths;
}

/**
 * Get all audio paths from a scene
 * @param {Object} scene - Scene object
 * @returns {string[]}
 */
export function getSceneAudioPaths(scene) {
  const paths = [];

  if (scene.assets?.music) {
    paths.push(resolveAssetPath(scene.assets.music));
  }

  return paths;
}

/**
 * Get all asset paths for a level
 * @param {Object} level - Level data
 * @returns {Object}
 */
export function getLevelAssetPaths(level) {
  const videos = [];
  const audio = [];
  const images = [];

  for (const scene of level.scenes) {
    videos.push(...getSceneVideoPaths(scene));
    audio.push(...getSceneAudioPaths(scene));

    if (scene.assets?.background) {
      images.push(resolveAssetPath(scene.assets.background));
    }
  }

  return {
    videos: [...new Set(videos)], // Dedupe
    audio: [...new Set(audio)],
    images: [...new Set(images)],
  };
}

/**
 * Load all core game data
 * @param {string} levelId - Level to load
 * @returns {Promise<LoadedAssets>}
 */
export async function loadGameData(levelId) {
  const [level, dscpClasses, voiceConfig] = await Promise.all([
    loadLevel(levelId),
    loadDscpClasses(),
    loadVoiceConfig(),
  ]);

  // Try to load citations (optional, may not exist yet)
  let citations = null;
  try {
    citations = await loadCitations();
  } catch {
    console.debug('Citations not loaded (file may not exist)');
  }

  return {
    level,
    dscpClasses,
    voiceConfig,
    citations,
  };
}

/**
 * Preload critical assets for fast first frame
 * @param {Object} level - Level data
 * @param {Object} callbacks - Progress callbacks
 * @param {Function} callbacks.onProgress - Called with (loaded, total)
 * @returns {Promise<void>}
 */
export async function preloadCriticalAssets(level, callbacks = {}) {
  const { onProgress } = callbacks;
  const firstScene = level.scenes[0];

  if (!firstScene) {
    return;
  }

  const criticalAssets = [];

  // First intro video is critical
  if (firstScene.assets?.intro) {
    criticalAssets.push({
      type: 'video',
      path: resolveAssetPath(firstScene.assets.intro),
    });
  }

  // First music track
  if (firstScene.assets?.music) {
    criticalAssets.push({
      type: 'audio',
      path: resolveAssetPath(firstScene.assets.music),
    });
  }

  const total = criticalAssets.length;
  let loaded = 0;

  const preloadPromises = criticalAssets.map(async asset => {
    try {
      if (asset.type === 'video') {
        await preloadVideo(asset.path);
      } else if (asset.type === 'audio') {
        await preloadAudio(asset.path);
      }
    } catch (err) {
      console.warn(`Failed to preload ${asset.path}:`, err);
    }

    loaded++;
    if (onProgress) {
      onProgress(loaded, total);
    }
  });

  await Promise.all(preloadPromises);
}

/**
 * Preload a video file
 * @param {string} path - Video path
 * @returns {Promise<void>}
 */
function preloadVideo(path) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';

    video.oncanplaythrough = () => resolve();
    video.onerror = () => reject(new Error(`Failed to preload video: ${path}`));

    video.src = path;
    video.load();
  });
}

/**
 * Preload an audio file
 * @param {string} path - Audio path
 * @returns {Promise<void>}
 */
function preloadAudio(path) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = 'auto';

    audio.oncanplaythrough = () => resolve();
    audio.onerror = () => reject(new Error(`Failed to preload audio: ${path}`));

    audio.src = path;
    audio.load();
  });
}

/**
 * Lazy-load assets for upcoming scenes
 * Loads assets for the next N scenes in the background
 * @param {Object} level - Level data
 * @param {string} currentSceneId - Current scene ID
 * @param {number} lookAhead - Number of scenes to preload ahead
 * @returns {Promise<void>}
 */
export async function lazyLoadUpcomingAssets(level, currentSceneId, lookAhead = 2) {
  const currentIndex = level.scenes.findIndex(s => s.id === currentSceneId);
  if (currentIndex === -1) {
    return;
  }

  const upcomingScenes = level.scenes.slice(currentIndex + 1, currentIndex + 1 + lookAhead);

  for (const scene of upcomingScenes) {
    // Load videos in background (don't await)
    const videoPaths = getSceneVideoPaths(scene);
    for (const path of videoPaths) {
      preloadVideo(path).catch(() => {});
    }

    // Load dialog if specified
    if (scene.dialogPath) {
      loadDialog(scene.dialogPath).catch(() => {});
    }
  }
}

/**
 * Lazy-load image assets
 * @param {string[]} imagePaths - Array of image paths
 * @returns {Promise<void>}
 */
export async function lazyLoadImages(imagePaths) {
  const promises = imagePaths.map(
    path =>
      new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // Continue even on error
        img.src = resolveAssetPath(path);
      })
  );

  await Promise.all(promises);
}

/**
 * Clear the data cache
 */
export function clearCache() {
  cache.clear();
}

/**
 * Check if data is cached
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isCached(url) {
  return cache.has(url);
}

/**
 * Get citation by ID
 * @param {Object} citations - Citations data
 * @param {string} citationId - Citation ID
 * @returns {Object|undefined}
 */
export function getCitation(citations, citationId) {
  if (!citations || !citations.claims) {
    return undefined;
  }
  return citations.claims.find(c => c.id === citationId);
}

/**
 * Get all citations for a scene
 * @param {Object} citations - Citations data
 * @param {Object} scene - Scene data
 * @returns {Object[]}
 */
export function getSceneCitations(citations, scene) {
  if (!citations || !scene.citations) {
    return [];
  }

  return scene.citations.map(id => getCitation(citations, id)).filter(Boolean);
}
