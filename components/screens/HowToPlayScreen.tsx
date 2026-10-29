"use client";
import Image from "next/image";
import { missionImage } from "@/lib/assets";
import { roundInfo } from "@/lib/gameData";

const GUIDE = [
  "Choose a word on the left, then its synonym on the right. Take your time and learn each pair; there is no timer. Use the hint to see the Spanish meaning.",
  "Match words with their synonyms before the timer runs out. Work quickly and accurately; each correct match helps you advance.",
  "Read the sentence and the target word, then type a complete synonym for it. Use the context to choose the best word.",
  "Watch words fall like meteors. Click the three wrong words before they land and let the correct synonym land safely. Choose 1×, 2× or 3× speed for an extra challenge.",
  "Complete the final multiple-choice challenge. Read each question and all answer options carefully before choosing your answer.",
];

/** V10 "How to Play?" */
export function HowToPlayScreen() {
  return <>
    <h1 className="section-title">How to <span style={{ color: "#ff48a7" }}>Play?</span></h1>
    <p className="sub">Your LEWTA explorer guide · Learn the rules for all five missions</p>
    <div className="instruction-grid">{roundInfo.map((r, i) => <div className="instruction-card" key={r.title}>
      <Image src={missionImage(i, "continue")} alt="" width={105} height={125} />
      <div><h3>{i + 1}. {r.title}</h3><p>{GUIDE[i]}</p><small>Complete the mission to move forward in your destination. First time: +{r.reward} XP and +{r.gemReward} 💎.</small></div>
    </div>)}</div>
    <div className="note">Finish all five missions in a city to unlock the next destination, a new alien, a passport stamp and the city reward. Missed words wait for you in Words to Revisit.</div>
  </>;
}
