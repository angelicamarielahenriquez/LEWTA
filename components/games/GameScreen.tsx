"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES, alienImage } from "@/lib/assets";
import { cityDecks, roundInfo } from "@/lib/gameData";
import { sentenceParts } from "@/lib/questions";
import type { Pair } from "@/types/lewta";

const timeText = (s: number) => `${String(Math.max(0, Math.floor(s / 60))).padStart(2, "0")}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;

/** Shows the right board for the current mission and the shared header (timer, progress, hint). */
export function GameScreen() {
  const { game, activeCity, timeLeft, paused, togglePause, leaveGame, startGame, showNotice } = useLewta();
  if (!game) return null;
  const info = roundInfo[game.roundIndex];
  const isPair = game.mode === "match" || game.mode === "speed";
  const done = isPair ? game.matched.length : game.questionIndex;
  const pair = game.pairs[game.questionIndex] || game.pairs[0];
  const hint = () => {
    if (isPair) {
      const sel = game.selectedLeft !== null ? (cityDecks[activeCity.id] || []).find((p) => p.id === game.selectedLeft) : null;
      showNotice(sel ? `Hint: “${sel.a}” means “${sel.spanish}” in Spanish.` : "Hint: choose a word on the left first.");
    } else showNotice(`Hint: “${pair.a}” means “${pair.spanish}”. Read the whole sentence before answering.`);
  };
  return <div className={`game-wrap mode-${game.mode} ${paused ? "is-paused" : ""}`}>
    <div className="game-head">
      <button className="btn ghost" onClick={leaveGame}>← Back to Missions</button>
      <div className="game-title"><div className="eyebrow">{activeCity.name} · MISSION {game.roundIndex + 1}</div><h1>{info.title}</h1></div>
      <div className="rush-status">
        {game.mode !== "context" && game.mode !== "match" && <span>⏱ <b>{timeText(timeLeft)}</b></span>}
        {game.mode === "review" && <span aria-label={`${game.hearts} hearts left`}>{"❤️".repeat(Math.max(0, game.hearts))}{"🤍".repeat(Math.max(0, 3 - game.hearts))}</span>}
        <span>{isPair ? `Pairs ${game.matched.length}/${game.pairs.length}` : `Question ${Math.min(game.questionIndex + 1, game.pairs.length)}/${game.pairs.length}`}</span>
        <span>⭐ +{info.reward} XP</span>
      </div>
    </div>
    <div className="progressbar game-progress"><div style={{ width: `${(done / Math.max(1, game.pairs.length)) * 100}%` }} /></div>
    <div className="rush-actions">
      <button onClick={hint}><Image src={IMAGES.games.hint} alt="" width={22} height={22} /> Show Hint</button>
      {(game.mode === "speed" || game.mode === "review" || game.mode === "boss") && <button onClick={togglePause}>{paused ? "▶ Resume Timer" : "⏸ Pause Timer"}</button>}
      <button onClick={() => startGame(game.roundIndex)}>↻ Reset Round</button>
    </div>
    {paused && <div className="paused-banner">⏸ Paused — press “Resume Timer” to continue.</div>}
    {isPair ? <MatchBoard /> : game.mode === "review" ? <ReviewRushBoard pair={pair} /> : <QuestionBoard pair={pair} />}
  </div>;
}

/** Learn & Match and Speed Match. */
function MatchBoard() {
  const { game, chooseMatchLeft, chooseMatchRight, paused } = useLewta();
  if (!game) return null;
  return <div className="match-columns" aria-disabled={paused}>
    <div className="word-column">{game.leftCards.map((p) => <button key={p.id} disabled={paused || game.matched.includes(p.id)}
      className={`word-card-btn left color-${p.id % 5} ${game.matched.includes(p.id) ? "matched" : ""} ${game.selectedLeft === p.id ? "selected" : ""}`} onClick={() => chooseMatchLeft(p.id)}>{p.a}</button>)}</div>
    <div className="word-column">{game.rightCards.map((p) => <button key={p.id} disabled={paused || game.matched.includes(p.id)}
      className={`word-card-btn right ${game.matched.includes(p.id) ? "matched" : ""} ${game.selectedRight === p.id ? "wrong" : ""}`} onClick={() => chooseMatchRight(p.id)}>{p.b}</button>)}</div>
  </div>;
}

function Sentence({ pair, highlight }: { pair: Pair; highlight?: boolean }) {
  const parts = sentenceParts(pair);
  if (!parts) return <p className="sentence">In this business context, what is closest in meaning to “{pair.a}”?</p>;
  return <p className="sentence">{parts.before}{highlight ? <mark>{parts.target}</mark> : <span className="blank" aria-label="blank">_____</span>}{parts.after}</p>;
}

/** Context Match (typing) and Business City Boss (A–D). */
function QuestionBoard({ pair }: { pair: Pair }) {
  const { game, setGameInput, submitAnswer, nextQuestion, paused } = useLewta();
  if (!game) return null;
  const isContext = game.mode === "context";
  return <div className="question">
    <div className="eyebrow">{isContext ? "TYPE THE COMPLETE SYNONYM" : "CHOOSE THE BEST ANSWER"}</div>
    <Sentence pair={pair} />
    {isContext ? <form className="typing-row" onSubmit={(e) => { e.preventDefault(); submitAnswer(game.input); }}>
      <input aria-label="Type the complete synonym" autoComplete="off" autoCapitalize="off" spellCheck={false} value={game.input} onChange={(e) => setGameInput(e.target.value)} placeholder="Type the complete answer…" disabled={game.answered} />
      <button className="btn" disabled={game.answered || !game.input.trim()}>Check answer</button>
    </form> : <>
      <div className="choices">{game.options.map((o, i) => <button key={o.value} disabled={game.answered || paused}
        className={`${game.input === String.fromCharCode(65 + i) ? "picked" : ""} ${game.answered && o.correct ? "correct" : ""} ${game.answered && game.chosenValue === o.value && !o.correct ? "incorrect" : ""}`}
        onClick={() => setGameInput(String.fromCharCode(65 + i))}><b>{String.fromCharCode(65 + i)}</b> {o.value}</button>)}</div>
      <button className="btn submit-btn" disabled={game.answered || !game.input || paused} onClick={() => submitAnswer(game.input)}>➤ Submit</button>
    </>}
    {game.answered && <div className={`feedback-panel ${game.answerCorrect ? "good" : "bad"}`} role="status">
      <h3>{game.answerCorrect ? "✅ Correct!" : "❌ Not quite!"}</h3>
      <p><b>Best answer:</b> {pair.b}{pair.spanish ? ` — ${pair.spanish}` : ""}</p>
      {pair.note && <p>{pair.note}</p>}
      <p className="small">Sentence: {pair.example}</p>
      <button className="btn yellow" onClick={nextQuestion} autoFocus>{game.questionIndex >= game.pairs.length - 1 ? "View Results" : "Next Question →"}</button>
    </div>}
  </div>;
}

/** Review Rush: wrong words fall like meteors; destroy them and let the correct synonym land. */
function ReviewRushBoard({ pair }: { pair: Pair }) {
  const { game, removeReviewRock, paused, selectedAlien } = useLewta();
  if (!game) return null;
  const wrongLeft = game.options.filter((o) => !o.correct && !game.removed.includes(o.value)).length;
  const landing = wrongLeft === 0;
  const lanes = [6, 30, 54, 76];
  return <div className="rush-board" style={{ backgroundImage: `url("${IMAGES.backgrounds.reviewRush}")` }}>
    <div className="question rush-question">
      <div className="eyebrow">TARGET WORD</div>
      <Sentence pair={pair} highlight />
      <p className="small">Click every falling word that is NOT a synonym of the highlighted word. Let the correct synonym land on your ship!</p>
    </div>
    <div className={`meteor-field ${paused ? "paused" : ""}`} key={`${game.questionIndex}`}>
      {game.options.map((o, i) => game.removed.includes(o.value) ? null :
        <button key={o.value} className={`meteor-word ${landing && o.correct ? "landing" : ""}`} disabled={paused || landing}
          style={{ left: `${lanes[i % lanes.length]}%`, animationDelay: `${i * 0.9}s` }} onClick={() => removeReviewRock(o)}>☄️ {o.value}</button>)}
      <Image className="rush-ship" src={alienImage(selectedAlien.id)} alt="Your alien ship" width={90} height={90} />
    </div>
    <p className="rush-message" role="status">{landing ? "🎉 Excellent! The correct synonym landed safely." : `Wrong meteors left: ${wrongLeft}`}</p>
  </div>;
}
