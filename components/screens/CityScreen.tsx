"use client";
import Image from "next/image";
import { useState } from "react";
import { WordList } from "@/components/screens/WordList";
import { useLewta } from "@/components/LewtaContext";
import { cityIcon, missionImage } from "@/lib/assets";
import { cityRewardAccessory, roundInfo } from "@/lib/gameData";

/** V10 city page: five missions, unlocked in order. */
export function CityScreen() {
  const { activeCity, roundDone, teacherPreviewMode, startGame, exitTeacherTest } = useLewta();
  const reward = cityRewardAccessory(activeCity.id);
  const [studyMission, setStudyMission] = useState(0);
  const study = (i: number) => { setStudyMission(i); document.getElementById("word-list")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return <>
    {teacherPreviewMode && <div className="note teacher-test-note"><b>TEACHER TESTING MODE</b> · Student XP, gems and unlocks are not changed. <button className="btn ghost" onClick={exitTeacherTest}>Exit test</button></div>}
    <div className="hero">
      <div><div className="eyebrow">CITY OF SYNONYMS · 12 DESTINATIONS</div><h1>Explore <em>{activeCity.name === "Panama City" ? "Panamá" : activeCity.name}</em></h1><p>Complete missions in order to unlock the next destination!</p></div>
      <Image className="hero-rocket" src={cityIcon(activeCity.id)} alt={activeCity.name} width={200} height={140} />
    </div>
    <h2 style={{ marginTop: 30 }}>Choose your mission</h2>
    <div className="mission-grid">{roundInfo.map((r, i) => {
      const done = roundDone.includes(i);
      const open = teacherPreviewMode || i === 0 || roundDone.includes(i - 1) || done;
      return <div key={r.title} className={`mission-card ${open ? "" : "mission-locked"}`}>
        <Image className="mission-art" src={missionImage(i, done ? "completed" : open ? "continue" : "locked")} alt="" width={290} height={235} />
        <strong>{r.title}</strong>
        <button className="btn yellow" disabled={!open} onClick={() => startGame(i)}>{done ? "Play Again →" : open ? "START →" : "🔒 Locked"}</button>
        <button className="study-link" onClick={() => study(i)}>📖 Study the words</button>
      </div>;
    })}</div>
    <WordList key={activeCity.id} cityId={activeCity.id} mission={studyMission} onMission={setStudyMission} />
    <p className="note">Complete each mission to unlock the next. Finish all five to earn the {activeCity.name} stamp, a new alien{reward ? ` and the ${reward.name}` : ""}. {roundDone.length}/5 missions completed.</p>
  </>;
}
