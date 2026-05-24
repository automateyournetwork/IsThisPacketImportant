/**
 * Video Player Module
 *
 * Wrapper for HTML5 video playback with preloading support.
 * Handles cutscene playback for the game.
 *
 * @module video-player
 */

/**
 * @typedef {Object} VideoState
 * @property {boolean} isPlaying - Whether video is currently playing
 * @property {boolean} isPaused - Whether video is paused
 * @property {boolean} isEnded - Whether video has ended
 * @property {boolean} isLoading - Whether video is loading
 * @property {number} currentTime - Current playback position in seconds
 * @property {number} duration - Total duration in seconds
 * @property {number} progress - Playback progress (0-100)
 */

/**
 * @callback VideoCallback
 * @param {VideoState} state
 */

/**
 * Create a video player instance
 * @param {HTMLVideoElement} videoElement - The video element to control
 * @returns {Object} Video player control object
 */
export function createVideoPlayer(videoElement) {
  if (!videoElement || !(videoElement instanceof HTMLVideoElement)) {
    throw new Error('Valid HTMLVideoElement required');
  }

  /** @type {Map<string, HTMLVideoElement>} Preloaded video cache */
  const preloadCache = new Map();

  /** @type {Set<VideoCallback>} Play end callbacks */
  const endCallbacks = new Set();

  /** @type {Set<VideoCallback>} State change callbacks */
  const stateCallbacks = new Set();

  /** @type {string|null} Currently loaded source */
  let currentSource = null;

  /** @type {boolean} Whether currently loading */
  let isLoading = false;

  /**
   * Get current video state
   * @returns {VideoState}
   */
  function getState() {
    return {
      isPlaying: !videoElement.paused && !videoElement.ended,
      isPaused: videoElement.paused,
      isEnded: videoElement.ended,
      isLoading,
      currentTime: videoElement.currentTime,
      duration: videoElement.duration || 0,
      progress: videoElement.duration
        ? (videoElement.currentTime / videoElement.duration) * 100
        : 0,
    };
  }

  /**
   * Notify state change callbacks
   */
  function notifyStateChange() {
    const state = getState();
    for (const callback of stateCallbacks) {
      callback(state);
    }
  }

  /**
   * Handle video ended event
   */
  function handleEnded() {
    const state = getState();
    for (const callback of endCallbacks) {
      callback(state);
    }
    notifyStateChange();
  }

  /**
   * Handle video state events
   */
  function handleStateEvent() {
    notifyStateChange();
  }

  // Set up event listeners
  videoElement.addEventListener('ended', handleEnded);
  videoElement.addEventListener('play', handleStateEvent);
  videoElement.addEventListener('pause', handleStateEvent);
  videoElement.addEventListener('loadstart', () => {
    isLoading = true;
    notifyStateChange();
  });
  videoElement.addEventListener('canplay', () => {
    isLoading = false;
    notifyStateChange();
  });

  /**
   * Load a video source
   * @param {string} src - Video source URL
   * @returns {Promise<void>}
   */
  async function load(src) {
    if (currentSource === src && !videoElement.error) {
      return; // Already loaded
    }

    isLoading = true;
    notifyStateChange();

    // Check preload cache
    const cached = preloadCache.get(src);
    if (cached && cached.readyState >= 3) {
      // Use cached video data
      videoElement.src = src;
      currentSource = src;
      await videoElement.load();
      isLoading = false;
      notifyStateChange();
      return;
    }

    // Load fresh
    const sourceEl = videoElement.querySelector('source');
    if (sourceEl) {
      sourceEl.src = src;
    } else {
      videoElement.src = src;
    }

    currentSource = src;

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        isLoading = false;
        notifyStateChange();
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
        resolve();
      };

      const onError = () => {
        isLoading = false;
        notifyStateChange();
        videoElement.removeEventListener('canplay', onCanPlay);
        videoElement.removeEventListener('error', onError);
        reject(new Error(`Failed to load video: ${src}`));
      };

      videoElement.addEventListener('canplay', onCanPlay);
      videoElement.addEventListener('error', onError);
      videoElement.load();
    });
  }

  /**
   * Play the video
   * @returns {Promise<void>}
   */
  async function play() {
    if (!currentSource) {
      throw new Error('No video loaded');
    }

    try {
      await videoElement.play();
    } catch (err) {
      // Handle autoplay restrictions
      if (err.name === 'NotAllowedError') {
        console.warn('Video autoplay blocked. User interaction required.');
        // Mute and try again (browsers allow muted autoplay)
        videoElement.muted = true;
        await videoElement.play();
      } else {
        throw err;
      }
    }
  }

  /**
   * Pause the video
   */
  function pause() {
    videoElement.pause();
  }

  /**
   * Stop the video (pause and reset to beginning)
   */
  function stop() {
    videoElement.pause();
    videoElement.currentTime = 0;
    notifyStateChange();
  }

  /**
   * Seek to a specific time
   * @param {number} time - Time in seconds
   */
  function seek(time) {
    videoElement.currentTime = Math.max(0, Math.min(time, videoElement.duration));
    notifyStateChange();
  }

  /**
   * Set video volume
   * @param {number} volume - Volume level (0-1)
   */
  function setVolume(volume) {
    videoElement.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get video volume
   * @returns {number}
   */
  function getVolume() {
    return videoElement.volume;
  }

  /**
   * Set muted state
   * @param {boolean} muted
   */
  function setMuted(muted) {
    videoElement.muted = muted;
  }

  /**
   * Check if video is muted
   * @returns {boolean}
   */
  function isMuted() {
    return videoElement.muted;
  }

  /**
   * Preload a video for later use
   * @param {string} src - Video source URL
   * @returns {Promise<void>}
   */
  async function preload(src) {
    if (preloadCache.has(src)) {
      return;
    }

    const video = document.createElement('video');
    video.preload = 'auto';
    video.src = src;

    preloadCache.set(src, video);

    return new Promise((resolve, reject) => {
      video.addEventListener('canplaythrough', () => resolve(), { once: true });
      video.addEventListener('error', () => reject(new Error(`Failed to preload: ${src}`)), {
        once: true,
      });
      video.load();
    });
  }

  /**
   * Preload multiple videos
   * @param {string[]} sources - Array of video source URLs
   * @returns {Promise<void[]>}
   */
  function preloadAll(sources) {
    return Promise.all(sources.map(src => preload(src).catch(err => console.warn(err))));
  }

  /**
   * Clear preload cache
   */
  function clearCache() {
    preloadCache.clear();
  }

  /**
   * Register callback for when video ends
   * @param {VideoCallback} callback
   * @returns {Function} Unsubscribe function
   */
  function onEnd(callback) {
    endCallbacks.add(callback);
    return () => endCallbacks.delete(callback);
  }

  /**
   * Register callback for state changes
   * @param {VideoCallback} callback
   * @returns {Function} Unsubscribe function
   */
  function onStateChange(callback) {
    stateCallbacks.add(callback);
    return () => stateCallbacks.delete(callback);
  }

  /**
   * Clean up the video player
   */
  function destroy() {
    videoElement.removeEventListener('ended', handleEnded);
    videoElement.removeEventListener('play', handleStateEvent);
    videoElement.removeEventListener('pause', handleStateEvent);
    endCallbacks.clear();
    stateCallbacks.clear();
    clearCache();
  }

  return {
    load,
    play,
    pause,
    stop,
    seek,
    setVolume,
    getVolume,
    setMuted,
    isMuted,
    preload,
    preloadAll,
    clearCache,
    getState,
    onEnd,
    onStateChange,
    destroy,
  };
}

/**
 * Check if a video format is supported
 * @param {string} mimeType - MIME type to check
 * @returns {boolean}
 */
export function isFormatSupported(mimeType) {
  const video = document.createElement('video');
  return video.canPlayType(mimeType) !== '';
}

/**
 * Check MP4/H.264 support
 * @returns {boolean}
 */
export function isMp4Supported() {
  return isFormatSupported('video/mp4; codecs="avc1.42E01E"');
}
