"use client";
import { useLewta } from "@/components/LewtaContext";
import { cities } from "@/lib/gameData";

/** V10 "Space soundtrack" bar: choose the LEWTA theme or the music of any unlocked city. */
export function MusicSelector() {
  const { musicTrack, chooseTrack, toggleMusic, progress, audio, setAudio, teacherPreviewMode } = useLewta();
  const value = musicTrack && musicTrack !== "review" ? musicTrack : "lewta";
  return <div className="music-select">
    <label htmlFor="track-select">🎵 Space soundtrack</label>
    <select id="track-select" value={value} onChange={(e) => chooseTrack(e.target.value)}>
      <option value="lewta">🌟 LEWTA Theme · Available</option>
      {cities.map((c) => { const open = teacherPreviewMode || progress.unlockedCities.includes(c.id); return <option key={c.id} value={c.id} disabled={!open}>{open ? "🌎" : "🔒"} {c.name} · {open ? "Unlocked" : "Locked"}</option>; })}
    </select>
    <button id="site-music-button" onClick={toggleMusic}>{musicTrack && !audio.muted ? "🔊" : "🔇"} Play / Pause</button>
    <input className="volume-range" type="range" min={0} max={1} step={0.05} value={audio.muted ? 0 : audio.volume} aria-label="Volume"
      onChange={(e) => setAudio({ volume: Number(e.target.value), muted: Number(e.target.value) === 0 })} />
    <small>Each city you unlock adds its own song.</small>
  </div>;
}
