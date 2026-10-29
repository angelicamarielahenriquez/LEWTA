"use client";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { cityName, roundInfo } from "@/lib/gameData";
import { progressLabel } from "@/lib/savedGame";

/** "Welcome back! You were on Question 7 of 10…" with Continue Game / Start over. */
export function ResumeCard() {
  const { savedGame, resumeSavedGame, discardSavedGame, page, game } = useLewta();
  const [hidden, setHidden] = useState(false);
  if (!savedGame || hidden || game || (page !== "hub" && page !== "city")) return null;
  const title = roundInfo[savedGame.roundIndex]?.title || "your mission";
  const city = cityName(savedGame.cityId) === "Panama City" ? "Panamá" : cityName(savedGame.cityId);
  return <div className="resume-card" role="dialog" aria-label="Continue your game">
    <div className="resume-icon" aria-hidden="true">🚀</div>
    <div className="resume-text">
      <strong>Welcome back!</strong>
      <span>You were on <b>{progressLabel(savedGame.game)}</b> in <b>{city} · {title}</b>. Ready to continue?</span>
    </div>
    <div className="resume-actions">
      <button className="btn" onClick={resumeSavedGame}>Continue Game →</button>
      <button className="btn ghost" onClick={() => { if (window.confirm("Start over? Your unfinished game will be removed (your XP, gems and completed missions stay safe).")) discardSavedGame(); }}>Start over</button>
      <button className="resume-later" onClick={() => setHidden(true)} aria-label="Not now">Not now</button>
    </div>
  </div>;
}
