"use client";
import { useState } from "react";
import { cityDecks, roundInfo } from "@/lib/gameData";
import type { Pair } from "@/types/lewta";

/** Which words each mission uses (same slices as buildRoundPairs). */
export function missionWords(cityId: string, roundIndex: number): Pair[] {
  const deck = cityDecks[cityId] || [];
  return roundIndex >= 4 ? deck.slice(0, 80) : deck.slice(roundIndex * 10, roundIndex * 10 + 10);
}

/** "Study the words" panel on each city page: the words and expected synonyms for every mission. */
export function WordList({ cityId, mission, onMission }: { cityId: string; mission: number; onMission: (i: number) => void }) {
  const [query, setQuery] = useState("");
  const words = missionWords(cityId, mission).filter((p) => `${p.a} ${p.b} ${p.spanish}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="panel word-list" id="word-list">
    <div className="eyebrow">📖 STUDY BEFORE YOU PLAY</div>
    <h2>Words and synonyms</h2>
    <p className="sub">Review the words of each mission and the synonym you are expected to find.</p>
    <div className="tabs word-list-tabs" role="tablist">
      {roundInfo.map((r, i) => <button key={r.title} role="tab" aria-selected={mission === i} className={mission === i ? "selected" : ""} onClick={() => onMission(i)}>
        <span className="wl-num">{i + 1}</span> {r.title}</button>)}
    </div>
    {mission === 3 && <p className="wl-note">☄️ Review Rush can also bring back up to 5 words from your Words to Revisit.</p>}
    {mission === 4 && <p className="wl-note">🏆 The Business City Boss uses all the words of this city.</p>}
    {mission === 4 && <input className="teacher-search wl-search" placeholder="Search a word…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search a word" />}
    <div className="wl-table">
      <div className="wl-head"><span>WORD</span><span>SYNONYM</span><span>SPANISH</span></div>
      {words.map((p) => <div key={p.id} className="wl-row"><b>{p.a}</b><span className="wl-syn">{p.b}</span><span className="wl-es">{p.spanish}</span></div>)}
      {!words.length && <p className="sub">No words found.</p>}
    </div>
  </section>;
}
