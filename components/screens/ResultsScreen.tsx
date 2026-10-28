"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { alienImage, accessoryImage } from "@/lib/assets";
import { accessories, aliens, cityName, roundInfo } from "@/lib/gameData";

export function ResultsScreen() {
  const { gameResult: r, progress, startGame, go, teacherPreviewMode, enterCity } = useLewta();
  if (!r) return null;
  const info = roundInfo[r.roundIndex];
  const alien = aliens.find((a) => a.id === r.newAlienId);
  const acc = accessories.find((a) => a.id === r.newAccessoryId);
  return <div className="result-card panel">
    <div className="result-icon" aria-hidden="true">{r.passed ? "🏆" : r.timedOut ? "⏱️" : "🛠️"}</div>
    <h1>{r.passed ? "Mission Complete!" : r.timedOut ? "Time’s up!" : "Keep Practicing!"}</h1>
    <p>{r.passed ? `You finished ${info.title} in ${cityName(r.cityId)}!` : r.timedOut ? "Your unanswered words were added to Words to Revisit. Try again to complete this mission." : "Your progress is safe. Review the feedback and try this mission again."}</p>
    <div className="stats">
      <div className="stat"><b>{r.correct}</b><span>Correct / matched</span></div>
      <div className="stat"><b>{r.total}</b><span>Total items</span></div>
      <div className="stat"><b>+{r.xpEarned}</b><span>{r.replay ? "XP (replay bonus)" : "XP this round"}</span></div>
      <div className="stat"><b>+{r.gemsEarned}</b><span>Gems · balance {progress.gems}</span></div>
    </div>
    {(alien || r.newCityId || acc) && <div className="unlock-banner">
      {alien && <div><Image src={alienImage(alien.id)} alt="" width={90} height={90} /><b>New alien: {alien.name}!</b></div>}
      {acc && <div><Image src={accessoryImage(acc.image)} alt="" width={70} height={70} /><b>City reward: {acc.name}</b></div>}
      {r.newCityId && <div><span className="big-emoji" aria-hidden="true">✈️</span><b>New destination: {cityName(r.newCityId)}!</b></div>}
    </div>}
    <div className="result-actions">
      <button className="btn" onClick={() => (r.passed ? (r.roundIndex < 4 ? startGame(r.roundIndex + 1) : r.newCityId ? enterCity(r.newCityId) : go("passport")) : startGame(r.roundIndex))}>
        {r.passed ? (r.roundIndex < 4 ? "Next Mission →" : r.newCityId ? `Fly to ${cityName(r.newCityId)} →` : "View Passport →") : "Try Again ↻"}
      </button>
      <button className="btn ghost" onClick={() => enterCity(r.cityId)}>Back to {cityName(r.cityId)}</button>
      <button className="btn ghost" onClick={() => go("passport")}>🛂 My Passport</button>
    </div>
    <p className="small">{teacherPreviewMode ? "Teacher testing mode: this attempt did not change student progress." : "XP and gems are saved to your profile automatically."}</p>
  </div>;
}
