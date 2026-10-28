"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta, type ReviewMode } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";
import { cities, cityDecks } from "@/lib/gameData";
import { createStableQuestionOptions, normalizeAnswer } from "@/lib/questions";
import type { Pair } from "@/types/lewta";

/** Words to Revisit: two correct answers in a row master a missed word (original rule). */
export function RevisitScreen() {
  const { progress, activeCity, markMastered, addMiss, playEffect, showNotice, teacherPreviewMode } = useLewta();
  const withMisses = cities.filter((c) => (progress.missedPairIds[c.id] || []).length > 0);
  const [cityId, setCityId] = useState(withMisses.some((c) => c.id === activeCity.id) || withMisses.length === 0 ? activeCity.id : withMisses[0].id);
  const [mode, setMode] = useState<ReviewMode>("flashcards");
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const deck = cityDecks[cityId] || [];
  const missed = (progress.missedPairIds[cityId] || []).map((id) => deck.find((p) => p.id === id)).filter((p): p is Pair => Boolean(p));
  const practice = missed.length ? missed : deck.slice(0, 10);
  const word = practice[cursor % Math.max(1, practice.length)] || practice[0];
  const options = word ? createStableQuestionOptions(word, deck) : [];
  const masteredBefore = (id: number) => ((progress.masteryCounts[cityId] || {})[String(id)] || 0) >= 1;
  const move = (d: number) => { setCursor((v) => (v + d + practice.length) % practice.length); setRevealed(false); setTyped(""); };
  const correct = () => {
    playEffect("correct");
    if (!missed.length) { showNotice("Correct! ⭐"); return; }
    const now = masteredBefore(word.id); markMastered(cityId, word.id);
    showNotice(now ? "Excellent! This word is now mastered." : "Correct! One more correct answer in a row to master this word.");
  };
  const wrong = (msg: string) => { playEffect("incorrect"); if (missed.length) addMiss(cityId, [word.id]); showNotice(msg); };
  if (!word) return null;
  return <>
    <div className="revisit-panel">
      <Image className="revisit-target" src={IMAGES.rewards.revisitTarget} alt="" width={125} height={125} />
      <div><h1 className="section-title">Words to <em>Revisit</em></h1><p className="sub">Practice the words you found difficult. Get two correct answers in a row to master a missed word!</p></div>
      <div className="stamp-counter">🎯 {missed.length} words to revisit</div>
    </div>
    <label className="city-picker">Destination
      <select value={cityId} onChange={(e) => { setCityId(e.target.value); setCursor(0); setRevealed(false); }}>
        {cities.filter((c) => progress.unlockedCities.includes(c.id) || teacherPreviewMode).map((c) => <option key={c.id} value={c.id}>{c.name} ({(progress.missedPairIds[c.id] || []).length} to revisit)</option>)}
      </select>
    </label>
    <div className="revisit-modes">{([["flashcards", "▣ Flashcards"], ["multiple", "◉ Multiple Choice"], ["typing", "⌨ Typing"]] as const).map(([id, label]) =>
      <button key={id} className={`mode-tab ${mode === id ? "active" : ""}`} onClick={() => { setMode(id); setRevealed(false); setTyped(""); }}>{label}</button>)}</div>
    {!missed.length && <div className="note">🌟 Great work! You have no missed words here. Practice this short set while your list grows.</div>}
    <div className="word-card">
      <div className="tiny-label">WORD {cursor % practice.length + 1} OF {practice.length}</div>
      {mode === "flashcards" ? <>
        <h2>{word.a}</h2>
        {revealed ? <><h2 className="answer">{word.b}</h2><p>{word.spanish} · {word.note}</p>
          {missed.length > 0 && <button className="pink-action" onClick={() => { correct(); setRevealed(false); if (masteredBefore(word.id)) move(1); }}>✓ I knew it</button>}</>
          : <><p>Think of the closest synonym, then reveal it.</p><button className="pink-action" onClick={() => setRevealed(true)}>Reveal synonym</button></>}
      </> : mode === "multiple" ? <>
        <h3>Choose the synonym of “{word.a}”.</h3>
        <div className="answer-grid">{options.map((o, i) => <button key={o.value} onClick={() => (o.correct ? correct() : wrong(`Try again. Hint: ${word.spanish}.`))}>{"ABCD"[i]} · {o.value}</button>)}</div>
      </> : <>
        <h3>Type the synonym of “{word.a}”.</h3>
        <form onSubmit={(e) => { e.preventDefault(); if (normalizeAnswer(typed) === normalizeAnswer(word.b)) { correct(); setTyped(""); } else wrong(`Not quite. The best match is “${word.b}”.`); }}>
          <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type the synonym..." autoComplete="off" aria-label="Your answer" />
          <button className="pink-action">Check answer</button>
        </form>
      </>}
      <div className="word-nav"><button onClick={() => move(-1)}>← Previous</button><button onClick={() => move(1)}>Next word →</button></div>
    </div>
    <div className="panel"><h3>Your tricky words</h3>
      {missed.length ? <div className="word-table">{missed.map((p, i) => <div key={p.id}><strong>{p.a}</strong><span>{p.b}</span><span>{p.spanish}</span><button onClick={() => { setMode("flashcards"); setCursor(i); setRevealed(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Practice</button></div>)}</div>
        : <p className="small">Words you miss in future missions will appear here automatically.</p>}
    </div>
  </>;
}
