/**
 * Audio Player Module
 *
 * Handles TTS voice lines and sound effects playback.
 * Supports multiple simultaneous audio tracks.
 *
 * @module audio-player
 */

/**
 * @typedef {Object} AudioTrack
 * @property {string} id - Track identifier
 * @property {string} src - Audio source URL
 * @property {number} volume - Track volume (0-1)
 * @property {boolean} loop - Whether to loop
 */

/**
 * @typedef {'voice' | 'sfx' | 'music'} AudioChannel
 */

/**
 * @typedef {Object} AudioState
 * @property {boolean} isPlaying - Whether audio is playing
 * @property {number} currentTime - Current playback position
 * @property {number} duration - Total duration
 */

/**
 * @callback AudioCallback
 * @param {AudioState} state
 */

/**
 * Create an audio player instance
 * @returns {Object} Audio player control object
 */
export function createAudioPlayer() {
  /** @type {Map<string, HTMLAudioElement>} Active audio elements by ID */
  const activeTracks = new Map();

  /** @type {Map<string, HTMLAudioElement>} Preloaded audio cache */
  const preloadCache = new Map();

  /** @type {Map<AudioChannel, number>} Volume levels per channel */
  const channelVolumes = new Map([
    ['voice', 1.0],
    ['sfx', 1.0],
    ['music', 0.5],
  ]);

  /** @type {number} Master volume */
  let masterVolume = 1.0;

  /** @type {Map<string, Set<AudioCallback>>} End callbacks per track */
  const endCallbacks = new Map();

  /**
   * Calculate effective volume for a track
   * @param {AudioChannel} channel
   * @param {number} trackVolume
   * @returns {number}
   */
  function getEffectiveVolume(channel, trackVolume = 1.0) {
    const channelVol = channelVolumes.get(channel) ?? 1.0;
    return masterVolume * channelVol * trackVolume;
  }

  /**
   * Play an audio track
   * @param {string} id - Unique track identifier
   * @param {string} src - Audio source URL
   * @param {Object} [options] - Playback options
   * @param {AudioChannel} [options.channel='sfx'] - Audio channel
   * @param {number} [options.volume=1.0] - Track volume
   * @param {boolean} [options.loop=false] - Whether to loop
   * @returns {Promise<void>}
   */
  async function play(id, src, options = {}) {
    const { channel = 'sfx', volume = 1.0, loop = false } = options;

    // Stop existing track with same ID
    if (activeTracks.has(id)) {
      stop(id);
    }

    // Check cache or create new element
    let audio = preloadCache.get(src);
    if (!audio) {
      audio = new Audio(src);
    } else {
      // Clone cached audio for simultaneous playback
      audio = audio.cloneNode(true);
    }

    audio.volume = getEffectiveVolume(channel, volume);
    audio.loop = loop;

    // Store track info
    activeTracks.set(id, audio);
    audio.dataset.channel = channel;
    audio.dataset.trackVolume = volume.toString();

    // Set up end handler
    const handleEnd = () => {
      const callbacks = endCallbacks.get(id);
      if (callbacks) {
        const state = getState(id);
        for (const callback of callbacks) {
          callback(state);
        }
      }
      if (!loop) {
        activeTracks.delete(id);
      }
    };

    audio.addEventListener('ended', handleEnd);

    try {
      await audio.play();
    } catch (err) {
      console.warn(`Failed to play audio ${id}:`, err);
      activeTracks.delete(id);
      throw err;
    }
  }

  /**
   * Play a voice line
   * @param {string} id - Track identifier
   * @param {string} src - Audio source URL
   * @param {number} [volume=1.0] - Volume level
   * @returns {Promise<void>}
   */
  function playVoice(id, src, volume = 1.0) {
    return play(id, src, { channel: 'voice', volume, loop: false });
  }

  /**
   * Play a sound effect
   * @param {string} id - Track identifier
   * @param {string} src - Audio source URL
   * @param {number} [volume=1.0] - Volume level
   * @returns {Promise<void>}
   */
  function playSfx(id, src, volume = 1.0) {
    return play(id, src, { channel: 'sfx', volume, loop: false });
  }

  /**
   * Play background music
   * @param {string} id - Track identifier
   * @param {string} src - Audio source URL
   * @param {number} [volume=1.0] - Volume level
   * @returns {Promise<void>}
   */
  function playMusic(id, src, volume = 1.0) {
    return play(id, src, { channel: 'music', volume, loop: true });
  }

  /**
   * Stop a specific track
   * @param {string} id - Track identifier
   */
  function stop(id) {
    const audio = activeTracks.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      activeTracks.delete(id);
    }
  }

  /**
   * Stop all tracks on a channel
   * @param {AudioChannel} channel
   */
  function stopChannel(channel) {
    for (const [id, audio] of activeTracks) {
      if (audio.dataset.channel === channel) {
        stop(id);
      }
    }
  }

  /**
   * Stop all audio
   */
  function stopAll() {
    for (const id of activeTracks.keys()) {
      stop(id);
    }
  }

  /**
   * Pause a specific track
   * @param {string} id - Track identifier
   */
  function pause(id) {
    const audio = activeTracks.get(id);
    if (audio) {
      audio.pause();
    }
  }

  /**
   * Resume a paused track
   * @param {string} id - Track identifier
   * @returns {Promise<void>}
   */
  async function resume(id) {
    const audio = activeTracks.get(id);
    if (audio) {
      await audio.play();
    }
  }

  /**
   * Pause all audio
   */
  function pauseAll() {
    for (const audio of activeTracks.values()) {
      audio.pause();
    }
  }

  /**
   * Resume all paused audio
   */
  function resumeAll() {
    for (const audio of activeTracks.values()) {
      if (audio.paused && audio.currentTime > 0) {
        audio.play().catch(() => {});
      }
    }
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0-1)
   */
  function setMasterVolume(volume) {
    masterVolume = Math.max(0, Math.min(1, volume));
    updateAllVolumes();
  }

  /**
   * Get master volume
   * @returns {number}
   */
  function getMasterVolume() {
    return masterVolume;
  }

  /**
   * Set channel volume
   * @param {AudioChannel} channel
   * @param {number} volume - Volume level (0-1)
   */
  function setChannelVolume(channel, volume) {
    channelVolumes.set(channel, Math.max(0, Math.min(1, volume)));
    updateAllVolumes();
  }

  /**
   * Get channel volume
   * @param {AudioChannel} channel
   * @returns {number}
   */
  function getChannelVolume(channel) {
    return channelVolumes.get(channel) ?? 1.0;
  }

  /**
   * Update volumes for all active tracks
   */
  function updateAllVolumes() {
    for (const audio of activeTracks.values()) {
      const channel = audio.dataset.channel;
      const trackVolume = parseFloat(audio.dataset.trackVolume || '1');
      audio.volume = getEffectiveVolume(channel, trackVolume);
    }
  }

  /**
   * Preload an audio file
   * @param {string} src - Audio source URL
   * @returns {Promise<void>}
   */
  async function preload(src) {
    if (preloadCache.has(src)) {
      return;
    }

    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = src;

    preloadCache.set(src, audio);

    return new Promise((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', () => reject(new Error(`Failed to preload: ${src}`)), {
        once: true,
      });
      audio.load();
    });
  }

  /**
   * Preload multiple audio files
   * @param {string[]} sources - Array of audio source URLs
   * @returns {Promise<void[]>}
   */
  function preloadAll(sources) {
    return Promise.all(sources.map(src => preload(src).catch(err => console.warn(err))));
  }

  /**
   * Get state of a track
   * @param {string} id - Track identifier
   * @returns {AudioState|null}
   */
  function getState(id) {
    const audio = activeTracks.get(id);
    if (!audio) {
      return null;
    }

    return {
      isPlaying: !audio.paused && !audio.ended,
      currentTime: audio.currentTime,
      duration: audio.duration || 0,
    };
  }

  /**
   * Check if a track is playing
   * @param {string} id - Track identifier
   * @returns {boolean}
   */
  function isPlaying(id) {
    const state = getState(id);
    return state?.isPlaying ?? false;
  }

  /**
   * Register callback for when track ends
   * @param {string} id - Track identifier
   * @param {AudioCallback} callback
   * @returns {Function} Unsubscribe function
   */
  function onEnd(id, callback) {
    if (!endCallbacks.has(id)) {
      endCallbacks.set(id, new Set());
    }
    endCallbacks.get(id).add(callback);
    return () => endCallbacks.get(id)?.delete(callback);
  }

  /**
   * Clear preload cache
   */
  function clearCache() {
    preloadCache.clear();
  }

  /**
   * Clean up all resources
   */
  function destroy() {
    stopAll();
    clearCache();
    endCallbacks.clear();
  }

  return {
    play,
    playVoice,
    playSfx,
    playMusic,
    stop,
    stopChannel,
    stopAll,
    pause,
    resume,
    pauseAll,
    resumeAll,
    setMasterVolume,
    getMasterVolume,
    setChannelVolume,
    getChannelVolume,
    preload,
    preloadAll,
    getState,
    isPlaying,
    onEnd,
    clearCache,
    destroy,
  };
}

/**
 * Check if an audio format is supported
 * @param {string} mimeType - MIME type to check
 * @returns {boolean}
 */
export function isFormatSupported(mimeType) {
  const audio = document.createElement('audio');
  return audio.canPlayType(mimeType) !== '';
}

/**
 * Check MP3 support
 * @returns {boolean}
 */
export function isMp3Supported() {
  return isFormatSupported('audio/mpeg');
}
