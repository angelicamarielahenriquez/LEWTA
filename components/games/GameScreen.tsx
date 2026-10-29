"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { alienImage } from "@/lib/assets";
import { roundInfo } from "@/lib/gameData";
import { contextHint, sentenceParts } from "@/lib/questions";
import { RUSH_LANES, destroyedCount, waveOutcome, wrongCount } from "@/lib/reviewRush";
import type { Pair } from "@/types/lewta";

const timeText = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

function Sentence({ pair }: { pair: Pair }) {
  const parts = sentenceParts(pair);
  if (!parts) return <h2>What is closest in meaning to “{pair.a}”?</h2>;
  return <h2>{parts.before}<span className="blank-line">_____</span>{parts.after}</h2>;
}

/** The five games inside the V10 mission layout (hero + game panel). */
export function GameScreen() {
  const { game, activeCity, timeLeft, paused, togglePause, leaveGame, startGame, selectedAlien } = useLewta();
  const [hintFor, setHintFor] = useState("");
  if (!game) return null;
  const info = roundInfo[game.roundIndex];
  const isPair = game.mode === "match" || game.mode === "speed";
  const pair = game.pairs[game.questionIndex] || game.pairs[0];
  const key = `${game.roundIndex}-${game.questionIndex}`;
  const hintOpen = hintFor === key;
  const score = game.mode === "review" ? game.points : (isPair ? game.matched.length : game.correctAnswers) * 10;
  const timed = game.mode === "speed" || game.mode === "review" || game.mode === "boss";
  const hintText = isPair
    ? (game.selectedLeft !== null ? (() => { const p = game.pairs.find((x) => x.id === game.selectedLeft); return p ? `“${p.a}” means “${p.spanish}” in Spanish.` : ""; })() : "Choose a word on the left first, then look for the word with the same meaning.")
    : game.mode === "context" ? contextHint(pair)
    : `“${pair.a}” means “${pair.spanish}” in Spanish.`;
  const actions = <div className="rush-actions">
    <button onClick={() => setHintFor(hintOpen ? "" : key)}>💡 {hintOpen ? "Hide Hint" : "Show Hint"}</button>
    {timed && <button onClick={togglePause} disabled={game.over}>{paused ? "▶ Resume" : "⏸ Pause"} Timer</button>}
    <button onClick={() => startGame(game.roundIndex)}>↻ Reset Round</button>
  </div>;
  const hint = hintOpen ? <p className="hint-text">{hintText}</p> : null;
  const city = activeCity.name.toUpperCase();

  if (game.mode === "review") return <>
    <button className="btn ghost" onClick={leaveGame}>← Back to Missions</button>
    <div className="hero" style={{ marginTop: 22 }}>
      <div><div className="eyebrow">{city} · REVIEW RUSH</div><h1>☄️ Review Rush</h1><p>Remove the wrong falling words. Let the correct synonym reach the ship!</p></div>
      <Image className="hero-rocket" src={alienImage(selectedAlien.id)} alt="" width={200} height={140} />
    </div>
    <div className="demo-game rush-demo"><ReviewRush pair={pair} actions={actions} hint={hint} score={score} time={timeLeft} /></div>
    <p className="note">Destroy the 3 wrong meteors before they land and let the correct synonym reach the ground. Clicking the correct synonym or letting a wrong meteor land costs one life — you have 3 lives for all {game.pairs.length} words.</p>
  </>;

  return <>
    <button className="btn ghost" onClick={leaveGame}>← Back to Missions</button>
    <div className="hero" style={{ marginTop: 22 }}>
      <div className="eyebrow">{city} · MISSION {game.roundIndex + 1}</div><h1>{info.title}</h1><p>{info.subtitle}</p>
    </div>
    <div className="demo-game">
      <div className="demo-toolbar"><span>⭐ Score: {score}</span><span>{isPair ? `Pairs ${game.matched.length} / ${game.pairs.length}` : `Question ${Math.min(game.questionIndex + 1, game.pairs.length)} / ${game.pairs.length}`}</span><span>⏱ <b id="demo-timer">{timed ? timeText(timeLeft) : "∞"}</b></span></div>
      <div className="question">
        {paused && <p className="hint-text">⏸ Paused — press Resume to continue.</p>}
        {isPair ? <MatchBoard actions={actions} hint={hint} /> : game.mode === "context" ? <ContextBoard pair={pair} actions={actions} hint={hint} /> : <BossBoard pair={pair} actions={actions} hint={hint} />}
      </div>
    </div>
  </>;
}

type BoardProps = { actions: React.ReactNode; hint: React.ReactNode };

function MatchBoard({ actions, hint }: BoardProps) {
  const { game, chooseMatchLeft, chooseMatchRight, paused } = useLewta();
  if (!game) return null;
  return <>
    <div className="eyebrow">{game.mode === "speed" ? "SPEED MATCH · BEAT THE CLOCK" : "LEARN & MATCH"}</div>
    <h2>Find the matching pairs</h2>
    <p>Choose a word and then its synonym. Click a selected word again to unselect it.</p>
    {actions}{hint}
    <div className="choices match-board">
      <div className="match-col">{game.leftCards.map((p) => <button key={p.id} disabled={paused || game.matched.includes(p.id)}
        className={`${game.matched.includes(p.id) ? "matched" : ""} ${game.selectedLeft === p.id ? (game.mismatch ? "wrong" : "picked") : ""}`} aria-pressed={game.selectedLeft === p.id} onClick={() => chooseMatchLeft(p.id)}>{p.a}</button>)}</div>
      <div className="match-col">{game.rightCards.map((p) => <button key={p.id} disabled={paused || game.matched.includes(p.id)}
        className={`${game.matched.includes(p.id) ? "matched" : ""} ${game.selectedRight === p.id ? (game.mismatch ? "wrong" : "picked") : ""}`} aria-pressed={game.selectedRight === p.id} onClick={() => chooseMatchRight(p.id)}>{p.b}</button>)}</div>
    </div>
  </>;
}

function Feedback({ pair }: { pair: Pair }) {
  const { game, nextQuestion } = useLewta();
  if (!game?.answered) return null;
  return <>
    <div className="feedback">{game.answerCorrect ? "Correct! " : "Try again next time! "}Best answer: {pair.b}{pair.spanish ? ` (${pair.spanish})` : ""}.</div>
    {pair.note && <p className="feedback-note">{pair.note}</p>}
    <button className="btn" onClick={nextQuestion} autoFocus>{game.questionIndex >= game.pairs.length - 1 ? "View Results →" : "Next Question →"}</button>
  </>;
}

function ContextBoard({ pair, actions, hint }: BoardProps & { pair: Pair }) {
  const { game, setGameInput, submitAnswer } = useLewta();
  if (!game) return null;
  return <>
    <div className="eyebrow">CONTEXT MATCH</div>
    <Sentence pair={pair} />
    <p>Type the complete synonym that fits the sentence.</p>
    {actions}{hint}
    <form className="type-answer" onSubmit={(e) => { e.preventDefault(); submitAnswer(game.input); }}>
      <input aria-label="Type the complete synonym" autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="Type the synonym..." value={game.input} disabled={game.answered} onChange={(e) => setGameInput(e.target.value)} />
      <button className="pink-action" disabled={game.answered || !game.input.trim()}>Check answer</button>
    </form>
    <Feedback pair={pair} />
  </>;
}

function BossBoard({ pair, actions, hint }: BoardProps & { pair: Pair }) {
  const { game, submitAnswer, paused } = useLewta();
  if (!game) return null;
  return <>
    <div className="eyebrow">BUSINESS CITY BOSS</div>
    <Sentence pair={pair} />
    <p>Choose the best answer.</p>
    {actions}{hint}
    <div className="choices">{game.options.map((o, i) => <button key={o.value} disabled={game.answered || paused}
      className={`${game.answered && o.correct ? "right" : ""} ${game.answered && game.chosenValue === o.value && !o.correct ? "wrong" : ""}`}
      onClick={() => submitAnswer(String.fromCharCode(65 + i))}>{o.value}</button>)}</div>
    <Feedback pair={pair} />
  </>;
}

function ReviewRush({ pair, actions, hint, score, time }: BoardProps & { pair: Pair; score: number; time: number }) {
  const { game, hitMeteor, paused, startGame, leaveGame } = useLewta();
  const started = game?.questionIndex === 0 && game.points === 0 && game.hearts === 3;
  // On phones, bring the target word and the whole play area into view when Review Rush starts.
  useEffect(() => {
    if (!started || typeof window === "undefined" || window.innerWidth > 720) return;
    document.querySelector(".rush-demo .question")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [started]);
  if (!game) return null;
  const wrongTotal = wrongCount(game.meteors);
  const destroyed = destroyedCount(game.meteors);
  const outcome = game.waveDone ? waveOutcome(game.meteors) : "pending";
  const message = game.over ? "💥 Game over — you ran out of lives."
    : outcome === "success" ? "🎉 Excellent! You destroyed every wrong meteor and the correct synonym landed safely."
    : outcome === "failed" ? `This word goes to Words to Revisit. The correct synonym was “${pair.b}”.`
    : `Wrong meteors destroyed: ${destroyed}/${wrongTotal}`;
  return <>
    <div className="rush-status"><span>⭐ Score: {score}</span><span>Question {game.questionIndex + 1} / {game.pairs.length}</span><span>⏱ <b id="demo-timer">{timeText(time)}</b></span><span className="rush-lives" aria-label={`${game.hearts} lives left`}>{"❤️".repeat(Math.max(0, game.hearts))}{"🖤".repeat(Math.max(0, 3 - game.hearts))} {Math.max(0, game.hearts)} lives</span></div>
    <div className="question">
      <div className="eyebrow">TARGET WORD</div>
      <h2>{pair.a}</h2>
      <p>Click every falling word that is NOT a synonym. Leave the correct synonym to fall!</p>
      <p className="rush-context">“{pair.example}”</p>
      {actions}{hint}
      <div className={`meteor-field ${paused ? "is-paused" : ""}`} key={`${game.roundIndex}-${game.questionIndex}`} data-testid="meteor-field">
        {game.meteors.map((m) => <button key={m.id} type="button" data-meteor={m.id} data-status={m.status} data-correct={m.correct ? "1" : undefined}
          className={`meteor-word lane-${m.lane} ${m.status}${m.status === "landed" ? " correct" : ""}`}
          disabled={m.status !== "falling" || paused || game.over}
          style={{ left: `${RUSH_LANES[m.lane]}%`, top: `calc((100% - var(--meteor-h)) * ${(m.y / 100).toFixed(4)})` }}
          onPointerDown={(e) => { e.preventDefault(); hitMeteor(m.id); }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); hitMeteor(m.id); } }}>
          <span className="meteor-text">{m.status === "destroyed" ? "💥" : "☄️"} {m.value}</span></button>)}
        {paused && !game.over && <div className="rush-overlay"><b>⏸ Paused</b><span>Press Resume Timer to continue.</span></div>}
        {game.over && <div className="rush-overlay game-over" role="alert">
          <b>GAME OVER</b><span>You ran out of lives. Your progress is safe — try Review Rush again!</span>
          <div className="result-actions"><button className="btn" onClick={() => startGame(game.roundIndex)}>Try Again ↻</button><button className="btn ghost" onClick={leaveGame}>← Back to Missions</button></div>
        </div>}
      </div>
      <p className="rush-message" aria-live="polite">{message}</p>
    </div>
  </>;
}
