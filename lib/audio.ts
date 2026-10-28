/**
 * Music and sound effects.
 * - Music and effects respect the mute button and the volume slider (saved on this device).
 * - Browsers block sound until the user clicks something; LEWTA only starts music after a click.
 */
import { AUDIO } from "@/lib/assets";

export type AudioSettings = { muted: boolean; volume: number };
const KEY = "lewta_audio_settings";

export function loadAudioSettings(): AudioSettings {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}") as Partial<AudioSettings>;
    return { muted: v.muted === true, volume: typeof v.volume === "number" ? Math.min(1, Math.max(0, v.volume)) : 0.7 };
  } catch { return { muted: false, volume: 0.7 }; }
}
export function saveAudioSettings(s: AudioSettings) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export class AudioController {
  private music: HTMLAudioElement | null = null;
  private musicSrc = "";
  private musicLevel = 0.2;
  settings: AudioSettings = { muted: false, volume: 0.7 };

  apply(settings: AudioSettings) {
    this.settings = settings;
    if (this.music) {
      this.music.volume = this.musicLevel * settings.volume;
      if (settings.muted) this.music.pause();
      else void this.music.play().catch(() => {});
    }
  }

  /** Starts looping music. Keeps playing (without restarting) if the same song is already on. */
  playMusic(src: string, level = 0.2) {
    this.musicLevel = level;
    if (this.music && this.musicSrc === src) {
      this.music.volume = level * this.settings.volume;
      if (!this.settings.muted && this.music.paused) void this.music.play().catch(() => {});
      return;
    }
    this.stopMusic();
    try {
      const a = new Audio(src);
      a.loop = true; a.volume = level * this.settings.volume;
      this.music = a; this.musicSrc = src;
      if (!this.settings.muted) void a.play().catch(() => {});
    } catch { /* audio is optional */ }
  }

  stopMusic() {
    if (this.music) { this.music.pause(); this.music.currentTime = 0; }
    this.music = null; this.musicSrc = "";
  }

  get currentMusic() { return this.musicSrc; }

  effect(name: keyof typeof AUDIO.effects, level = 0.5) {
    if (this.settings.muted) return;
    try { const a = new Audio(AUDIO.effects[name]); a.volume = Math.min(1, level * this.settings.volume); void a.play().catch(() => {}); } catch { /* optional */ }
  }
}
