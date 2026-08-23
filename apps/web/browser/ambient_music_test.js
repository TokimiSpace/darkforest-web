import { assert, assertEquals } from "jsr:@std/assert@1";
import { createAmbientMusicController } from "./ambient_music.js";

/** @param {{rejectPlay?: boolean}} [options] */
function fakeAudioHarness(options = {}) {
  const calls = { created: 0, paused: 0, played: 0 };
  const audio = {
    loop: false,
    paused: true,
    preload: "auto",
    src: "",
    volume: 1,
    pause() {
      calls.paused += 1;
      this.paused = true;
    },
    play() {
      calls.played += 1;
      if (options.rejectPlay === true) return Promise.reject(new Error("autoplay blocked"));
      this.paused = false;
      return Promise.resolve();
    },
  };
  return {
    audio,
    calls,
    createAudio() {
      calls.created += 1;
      return audio;
    },
  };
}

Deno.test("ambient music stays allocation-free until the player opts in", () => {
  const harness = fakeAudioHarness();
  const music = createAmbientMusicController({ createAudio: harness.createAudio });

  assertEquals(music.isEnabled(), false);
  assertEquals(music.hasLoadedSource(), false);
  assertEquals(harness.calls.created, 0);
  assertEquals(harness.calls.played, 0);
});

Deno.test("ambient music lazily configures one looping low-volume source", async () => {
  const harness = fakeAudioHarness();
  const music = createAmbientMusicController({
    createAudio: harness.createAudio,
    source: "/music.m4a",
    volume: 0.24,
  });

  music.setEnabled(true);
  assertEquals(await music.play(), true);
  assertEquals(await music.play(), true);
  assertEquals(harness.calls.created, 1);
  assertEquals(harness.calls.played, 2);
  assertEquals(harness.audio.src, "/music.m4a");
  assertEquals(harness.audio.preload, "none");
  assertEquals(harness.audio.loop, true);
  assertEquals(harness.audio.volume, 0.24);
  assertEquals(music.isPlaying(), true);

  music.setEnabled(false);
  assertEquals(harness.calls.paused, 1);
  assertEquals(music.isPlaying(), false);
  assertEquals(await music.play(), false);
  assertEquals(harness.calls.played, 2);
});

Deno.test("ambient music catches browser playback rejection and remains retryable", async () => {
  const harness = fakeAudioHarness({ rejectPlay: true });
  const music = createAmbientMusicController({
    createAudio: harness.createAudio,
    source: "/optional-music.m4a",
  });

  music.setEnabled(true);
  assertEquals(await music.play(), false);
  assertEquals(music.isEnabled(), true);
  assertEquals(harness.calls.created, 1);
  assertEquals(harness.calls.played, 1);
  assert(music.hasLoadedSource());
});

Deno.test("ambient music pause preserves opt-in for visibility and promo suspension", async () => {
  const harness = fakeAudioHarness();
  const music = createAmbientMusicController({
    createAudio: harness.createAudio,
    source: "/optional-music.m4a",
  });

  music.setEnabled(true);
  await music.play();
  music.pause();
  assertEquals(music.isEnabled(), true);
  assertEquals(music.isPlaying(), false);
  assertEquals(await music.play(), true);
  assertEquals(music.isPlaying(), true);
});
