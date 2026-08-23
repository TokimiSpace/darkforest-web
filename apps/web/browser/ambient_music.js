// @ts-check

/** @typedef {{loop: boolean, paused: boolean, preload: string, src: string, volume: number, pause: () => void, play: () => Promise<void> | void}} AmbientAudio */

/**
 * A tiny, dependency-free music controller. The audio element and source request do not exist
 * until play() is called from a trusted player interaction, keeping the lobby's initial transfer
 * and decode cost at zero.
 * @param {{source?: string, volume?: number, createAudio?: () => AmbientAudio}} [options]
 */
export function createAmbientMusicController(options = {}) {
  const source = typeof options.source === "string" ? options.source : "";
  const volume = Number.isFinite(options.volume)
    ? Math.max(0, Math.min(1, Number(options.volume)))
    : 0.24;
  const createAudio = typeof options.createAudio === "function"
    ? options.createAudio
    : () => new Audio();

  /** @type {AmbientAudio | null} */
  let audio = null;
  let enabled = false;
  /** @type {Promise<boolean> | null} */
  let playInFlight = null;

  function ensureAudio() {
    if (audio !== null) return audio;
    if (source === "") return null;
    audio = createAudio();
    audio.loop = true;
    audio.preload = "none";
    audio.volume = volume;
    audio.src = source;
    return audio;
  }

  /** @param {boolean} nextEnabled */
  function setEnabled(nextEnabled) {
    enabled = nextEnabled === true;
    if (!enabled) audio?.pause();
  }

  async function play() {
    if (!enabled) return false;
    if (playInFlight !== null) return await playInFlight;
    const activeAudio = ensureAudio();
    if (activeAudio === null) return false;
    playInFlight = Promise.resolve(activeAudio.play()).then(
      () => true,
      () => false,
    ).finally(() => {
      playInFlight = null;
    });
    return await playInFlight;
  }

  function pause() {
    audio?.pause();
  }

  return {
    setEnabled,
    play,
    pause,
    isEnabled: () => enabled,
    isPlaying: () => audio !== null && !audio.paused,
    hasLoadedSource: () => audio !== null,
  };
}
