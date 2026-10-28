"use client";
import { useState } from "react";
import { useLewta, type ReviewMode } from "@/components/LewtaContext";
import { cities, cityDecks } from "@/lib/gameData";
import { createStableQuestionOptions, normalizeAnswer } from "@/lib/questions";
import type { Pair } from "@/types/lewta";

/** V10 "Words to Revisit": two correct answers in a row master a missed word. */
export function RevisitScreen() {
  const { progress, activeCity, markMastered, addMiss, playEffect, teacherPreviewMode } = useLewta();
  const withMisses = cities.filter((c) => (progress.missedPairIds[c.id] || []).length > 0);
  const [cityId, setCityId] = useState(withMisses.some((c) => c.id === activeCity.id) || !withMisses.length ? activeCity.id : withMisses[0].id);
  const [mode, setMode] = useState<ReviewMode>("flashcards");
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [typed, setTyped] = useState("");
  const deck = cityDecks[cityId] || [];
  const missed = (progress.missedPairIds[cityId] || []).map((id) => deck.find((p) => p.id === id)).filter((p): p is Pair => Boolean(p));
  const words = missed.length ? missed : deck.slice(0, 5);
  const w = words[index % Math.max(1, words.length)] || words[0];
  const reset = () => { setRevealed(false); setFeedback(""); setTyped(""); };
  const next = (d: number) => { setIndex((v) => (v + d + words.length) % words.length); reset(); };
  const check = (value: string) => {
    if (normalizeAnswer(value) === normalizeAnswer(w.b)) {
      playEffect("correct");
      if (missed.length) { const already = ((progress.masteryCounts[cityId] || {})[String(w.id)] || 0) >= 1; markMastered(cityId, w.id); setFeedback(already ? "Correct! ⭐ This word is now mastered." : "Correct! ⭐ One more correct answer in a row to master it."); }
      else setFeedback("Correct! ⭐");
    } else { playEffect("incorrect"); if (missed.length) addMiss(cityId, [w.id]); setFeedback(`Try again! Hint: ${w.spanish}`); }
  };
  if (!w) return null;
  return <>
    <h1 className="section-title">Words to <span style={{ color: "#ff48a7" }}>Revisit</span></h1>
    <p className="sub">Practice words you found difficult. Get two correct answers in a row to master a missed word!</p>
    <div className="music-select revisit-city">
      <label htmlFor="revisit-city">🌎 Destination</label>
      <select id="revisit-city" value={cityId} onChange={(e) => { setCityId(e.target.value); setIndex(0); reset(); }}>
        {cities.filter((c) => teacherPreviewMode || progress.unlockedCities.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.name} · {(progress.missedPairIds[c.id] || []).length} to revisit</option>)}
      </select>
      <small>{missed.length ? `${missed.length} words to revisit in this destination.` : "No missed words here yet — practice a short sample set."}</small>
    </div>
    <div className="revisit-modes">{([["flashcards", "▣ Flashcards"], ["multiple", "◉ Multiple Choice"], ["typing", "⌨ Typing"]] as const).map(([id, l]) =>
      <button key={id} className={`mode-tab ${mode === id ? "active" : ""}`} onClick={() => { setMode(id); reset(); }}>{l}</button>)}</div>
    <div className="word-card">
      <div className="tiny-label">WORD {index % words.length + 1} OF {words.length}</div>
      {mode === "flashcards" ? <>
        <h2>{w.a}</h2><p>Think of the closest synonym. Click to reveal it.</p>
        {revealed ? <><h2 style={{ color: "#fb2b91" }}>{w.b}</h2><p>{w.spanish}</p>{missed.length > 0 && <button className="pink-action" onClick={() => check(w.b)}>✓ I knew it</button>}</>
          : <button className="pink-action" onClick={() => setRevealed(true)}>Reveal synonym</button>}
      </> : mode === "multiple" ? <>
        <h3>Choose the synonym of “{w.a}”.</h3>
        <div className="answer-grid">{createStableQuestionOptions(w, deck).map((o, i) => <button key={o.value} onClick={() => check(o.value)}>{"ABCD"[i]} · {o.value}</button>)}</div>
      </> : <>
        <h3>Type the synonym of “{w.a}”.</h3>
        <form onSubmit={(e) => { e.preventDefault(); check(typed); }}><input name="answer" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type the synonym..." autoComplete="off" /><button className="pink-action">Check answer</button></form>
      </>}
      {feedback && <p className="word-feedback">{feedback}</p>}
      <div className="word-nav"><button onClick={() => next(-1)}>← Previous</button><button onClick={() => next(1)}>Next word →</button></div>
    </div>
    <div className="panel" style={{ marginTop: 18 }}><h3>Your tricky words</h3>
      {missed.length ? <div className="word-table">{missed.map((x, i) => <div key={x.id}><strong>{x.a}</strong><span>{x.b}</span><span>{x.spanish}</span><button onClick={() => { setMode("flashcards"); setIndex(i); reset(); }}>Practice</button></div>)}</div>
        : <p className="sub">Words you miss in your missions will appear here automatically.</p>}
    </div>
  </>;
}
