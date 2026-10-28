"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES, cityIcon, missionImage } from "@/lib/assets";
import { cityRewardAccessory, playOrder, roundInfo } from "@/lib/gameData";

/** A destination: its five missions, unlocked one after another. */
export function CityScreen() {
  const { activeCity, roundDone, teacherPreviewMode, startGame, exitTeacherTest, go, progress } = useLewta();
  const reward = cityRewardAccessory(activeCity.id);
  const complete = roundDone.length >= 5;
  return <>
    {teacherPreviewMode && <div className="teacher-test-banner"><b>TEACHER TESTING MODE</b><span>Student XP, gems and unlocks are not changed during this test.</span><button className="btn ghost" onClick={exitTeacherTest}>Exit test</button></div>}
    <section className="hero">
      <div>
        <div className="eyebrow">CITY OF SYNONYMS · DESTINATION {playOrder.indexOf(activeCity.id) + 1} OF 12</div>
        <h1>Explore <em>{activeCity.name}</em></h1>
        <p>{activeCity.description}</p>
        <div className="progress-line"><span>{roundDone.length}/5 missions</span><div className="progressbar"><div style={{ width: `${roundDone.length * 20}%` }} /></div></div>
      </div>
      <Image className="hero-art city-art" src={cityIcon(activeCity.id)} alt={activeCity.name} width={200} height={200} />
    </section>
    <h2 className="subhead">Choose your mission</h2>
    <div className="mission-grid">
      {roundInfo.map((r, i) => {
        const done = roundDone.includes(i);
        const open = teacherPreviewMode || i === 0 || roundDone.includes(i - 1) || done;
        const state = done ? "completed" : open ? "continue" : "locked";
        return <div key={r.title} className={`mission-card ${open ? "" : "mission-locked"}`}>
          <Image className="mission-art" src={missionImage(i, state)} alt={`${r.title} — ${done ? "completed" : open ? "ready" : "locked"}`} width={290} height={235} />
          <strong>{r.title}</strong>
          <small>{i === 4 ? (activeCity.id === "new-york" ? "80 questions with Business English" : "All 80 city words") : `Words ${i * 10 + 1}–${i * 10 + 10}`}</small>
          <button className="btn yellow" disabled={!open} onClick={() => startGame(i)}>{done ? "Play Again →" : open ? "START →" : "🔒 Locked"}</button>
        </div>;
      })}
    </div>
    <div className="city-footer panel">
      <Image src={complete ? IMAGES.rewards.cityReward : IMAGES.navigation.nextDestination} alt="" width={80} height={80} />
      <div>
        <b>{complete ? "City complete! Your passport stamp is ready." : "Complete all five missions to earn this city's stamp, alien and reward."}</b>
        <p className="small">City reward: {reward?.name ?? "Passport stamp"}{teacherPreviewMode ? "" : ` · ${progress.unlockedCities.length}/12 destinations unlocked`}</p>
      </div>
      <button className="btn ghost" onClick={() => go("passport")}>🛂 View my passport</button>
    </div>
  </>;
}
