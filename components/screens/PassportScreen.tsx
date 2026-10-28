"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { StampCollection } from "@/components/screens/StampCollection";
import { cityIcon, cityStamp, missionImage } from "@/lib/assets";
import { cities, cityRewardAccessory, roundInfo } from "@/lib/gameData";
import { isCityComplete } from "@/lib/progress";

/** My Passport: the 12 destinations in their official order. */
export function PassportScreen() {
  const { progress, activeCity, teacherPreviewMode, enterCity, showNotice } = useLewta();
  const [selectedId, setSelectedId] = useState(activeCity.id);
  const city = cities.find((c) => c.id === selectedId) || cities[0];
  const unlocked = (id: string) => teacherPreviewMode || progress.unlockedCities.includes(id);
  const done = progress.completedRounds[city.id] || [];
  const reward = cityRewardAccessory(city.id);
  return <>
    <h1 className="section-title">My <em>Passport</em> 🛂</h1>
    <p className="sub">Complete all five missions in a city to earn its official passport stamp. {progress.unlockedCities.length}/12 destinations unlocked.</p>
    <div className="passport-layout">
      <div className="panel"><div className="passport">
        {cities.map((c, i) => {
          const complete = isCityComplete(progress, c.id);
          return <button key={c.id} className={`${selectedId === c.id ? "selected" : ""} ${unlocked(c.id) ? "" : "locked"} ${complete ? "stamped" : ""}`} onClick={() => setSelectedId(c.id)}>
            <span className="passport-num">{i + 1}</span>
            <Image src={cityIcon(c.id)} alt="" width={95} height={95} />
            {complete && <Image className="stamp-badge" src={cityStamp(c.id)} alt="" width={46} height={46} />}
            <strong>{c.name.toUpperCase()}</strong>
            <small>{complete ? "✓ STAMP EARNED" : unlocked(c.id) ? "⏳ STAMP PENDING" : "🔒 LOCKED"}</small>
          </button>;
        })}
      </div></div>
      <div className="panel passport-detail">
        <Image className="passport-city-image" src={isCityComplete(progress, city.id) ? cityStamp(city.id) : cityIcon(city.id)} alt={city.name} width={125} height={125} />
        <h2>{city.name}</h2><p className="small">{city.emoji} {city.country}</p>
        <p className="sub">{isCityComplete(progress, city.id) ? "🏅 Stamp collected! All five missions completed." : unlocked(city.id) ? "⏳ Finish all five missions to earn this stamp." : "🔒 Destination locked — finish the previous city first."}</p>
        <h3>Challenges</h3>
        {roundInfo.map((r, i) => {
          const d = done.includes(i); const open = unlocked(city.id) && (i === 0 || done.includes(i - 1) || d);
          return <div className="mission-row" key={r.title}>
            <Image src={missionImage(i, d ? "completed" : open ? "continue" : "locked")} alt="" width={58} height={58} />
            <div>{r.title}<small>{d ? "Completed" : open ? "Ready to play" : "Locked · complete the previous mission"}</small></div><b>{d ? "✓" : open ? "▶" : "🔒"}</b>
          </div>;
        })}
        {reward && <p className="small city-reward-line">🎁 City reward: <b>{reward.name}</b></p>}
        <button className="btn full" disabled={!unlocked(city.id)} onClick={() => (unlocked(city.id) ? enterCity(city.id) : showNotice("This destination is still locked."))}>{unlocked(city.id) ? "Explore Destination →" : "🔒 Destination Locked"}</button>
      </div>
    </div>
    <StampCollection />
  </>;
}
