"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { accessoryImage, alienImage, cityIcon } from "@/lib/assets";
import { accessories, aliens, cityName, roundInfo } from "@/lib/gameData";

/** Mission results, in the V10 hero / stats style. */
export function ResultsScreen() {
  const { gameResult: r, progress, startGame, go, enterCity, teacherPreviewMode } = useLewta();
  if (!r) return null;
  const info = roundInfo[r.roundIndex];
  const alien = aliens.find((a) => a.id === r.newAlienId);
  const acc = accessories.find((a) => a.id === r.newAccessoryId);
  return <>
    <button className="btn ghost" onClick={() => enterCity(r.cityId)}>← Back to Missions</button>
    <div className="hero" style={{ marginTop: 22 }}>
      <div><div className="eyebrow">{cityName(r.cityId)} · {info.title}</div>
        <h1>{r.passed ? <>Mission <em>Complete!</em></> : r.timedOut ? <>Time’s <em>up!</em></> : <>Keep <em>Practicing!</em></>}</h1>
        <p>{r.passed ? `You finished ${info.title} in ${cityName(r.cityId)}!` : r.timedOut ? "Your unanswered words were added to Words to Revisit. Try again to complete this mission." : "Your progress is safe. Try this mission again."}</p></div>
      <Image className="hero-rocket" src={alien ? alienImage(alien.id) : cityIcon(r.cityId)} alt="" width={200} height={140} />
    </div>
    <div className="stats">
      <div className="stat"><b>✅ {r.correct}/{r.total}</b><span>Correct answers</span></div>
      <div className="stat"><b>⭐ +{r.xpEarned}</b><span>{r.replay ? "XP (replay bonus)" : "XP this round"}</span></div>
      <div className="stat"><b>💎 +{r.gemsEarned}</b><span>Gems · balance {progress.gems}</span></div>
      <div className="stat"><b>🔥 {progress.streak}</b><span>Day streak</span></div>
    </div>
    {(alien || acc || r.newCityId) && <div className="panel unlock-panel">
      {alien && <div><Image src={alienImage(alien.id)} alt="" width={110} height={110} /><strong>New alien: {alien.name}!</strong></div>}
      {acc && <div><Image src={accessoryImage(acc.image)} alt="" width={90} height={90} /><strong>City reward: {acc.name}</strong></div>}
      {r.newCityId && <div><Image src={cityIcon(r.newCityId)} alt="" width={100} height={100} /><strong>New destination: {cityName(r.newCityId)}!</strong></div>}
    </div>}
    <div className="result-actions">
      <button className="btn" onClick={() => (r.passed ? (r.roundIndex < 4 ? startGame(r.roundIndex + 1) : r.newCityId ? enterCity(r.newCityId) : go("passport")) : startGame(r.roundIndex))}>
        {r.passed ? (r.roundIndex < 4 ? "Next Mission →" : r.newCityId ? `Fly to ${cityName(r.newCityId)} →` : "View Passport →") : "Try Again ↻"}</button>
      <button className="btn ghost" onClick={() => go("passport")}>🛂 My Passport</button>
    </div>
    <p className="note">{teacherPreviewMode ? "Teacher testing mode: this attempt did not change student progress." : "XP and gems are saved to your profile automatically."}</p>
  </>;
}
