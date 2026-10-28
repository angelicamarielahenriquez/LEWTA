"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { missionImage } from "@/lib/assets";
import { roundInfo } from "@/lib/gameData";

const GUIDE = [
  "Choose a word on the left, then its synonym on the right. Take your time: there is no timer. Use the hint to see the Spanish meaning.",
  "Match all ten pairs before the 60-second timer runs out. You can pause the timer if you need a break.",
  "Read the sentence and type the complete synonym that fits the blank. There is no countdown — think about the context.",
  "Words fall like meteors. Click every word that is NOT a synonym of the highlighted word and let the correct synonym land on your ship. Destroying the correct word costs one of your three hearts.",
  "The final challenge: choose A, B, C or D for every question about the city's 80 words before the 8-minute timer ends.",
];

export function HowToPlayScreen() {
  const { navigate } = useLewta();
  return <>
    <h1 className="section-title">How to <em>Play?</em></h1>
    <p className="sub">Your LEWTA explorer guide · Complete the five missions in order to unlock your next destination.</p>
    <div className="instruction-grid">{roundInfo.map((r, i) => <div className="instruction-card" key={r.title}>
      <Image src={missionImage(i, "continue")} alt="" width={105} height={125} />
      <div><h3>{i + 1}. {r.title}</h3><p>{GUIDE[i]}</p><small>Reward: +{r.reward} XP and +{r.gemReward} gems the first time. Playing again: +{Math.max(10, Math.round(r.reward * 0.2))} XP.</small></div>
    </div>)}</div>
    <div className="feature-row">
      {[["⭐", "Earn XP", "Finish missions to level up (every 500 XP)."], ["💎", "Collect gems", "Buy accessories for your alien in the Gem Shop."], ["🔥", "Keep your streak", "Complete a mission every day to grow your streak."], ["🛂", "Collect stamps", "Finish all five missions in a city to earn its stamp, alien and reward."], ["🎯", "Revisit words", "Missed words wait for you in Words to Revisit."]].map(([icon, title, text]) =>
        <div className="feature-card" key={title}><span aria-hidden="true">{icon}</span><b>{title}</b><p>{text}</p></div>)}
    </div>
    <div className="panel help-links"><button className="btn ghost" onClick={() => navigate("teacher")}>👩‍🏫 Teacher Dashboard</button><button className="btn ghost" onClick={() => navigate("exit")}>🚪 Exit</button></div>
  </>;
}
