"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { StampCollection } from "@/components/screens/StampCollection";
import { cityIcon, missionImage } from "@/lib/assets";
import { cities, roundInfo } from "@/lib/gameData";
import { isCityComplete } from "@/lib/progress";

const label = (name: string) => (name === "Panama City" ? "Panamá" : name);

/** V10 "My Passport". */
export function PassportScreen() {
  const { progress, activeCity, teacherPreviewMode, enterCity } = useLewta();
  const [selected, setSelected] = useState(activeCity.id);
  const city = cities.find((c) => c.id === selected) || cities[0];
  const open = (id: string) => teacherPreviewMode || progress.unlockedCities.includes(id);
  const done = progress.completedRounds[city.id] || [];
  const earned = isCityComplete(progress, city.id);
  return <>
    <h1 className="section-title">My <span style={{ color: "#ff48a7" }}>Passport</span> 🛂</h1>
    <p className="sub">Complete all five missions in a city to earn its official passport stamp. Stamps appear only when earned!</p>
    <div className="passport-layout">
      <div className="panel"><div className="passport">{cities.map((c) => {
        const st = isCityComplete(progress, c.id);
        return <button key={c.id} className={`${selected === c.id ? "selected" : ""} ${open(c.id) ? "" : "locked"} ${st ? "stamped" : ""}`} onClick={() => setSelected(c.id)}>
          <Image src={cityIcon(c.id)} alt="" width={95} height={95} />
          <strong>{label(c.name).toUpperCase()}</strong>
          <small>{st ? "✓ STAMP EARNED" : open(c.id) ? "⏳ STAMP PENDING" : "🔒 LOCKED"}</small>
        </button>;
      })}</div></div>
      <div className="panel" style={{ textAlign: "center" }}>
        <Image className="passport-city-image" src={cityIcon(city.id)} alt="Selected city" width={125} height={125} />
        <h2>{label(city.name)}</h2>
        <p className="sub">{earned ? "🏅 Stamp collected! All five missions completed." : open(city.id) ? "⏳ Finish all five missions to earn this stamp." : "🔒 Destination locked — stamp not yet available."}</p>
        <h3>Challenges</h3>
        {roundInfo.map((r, i) => {
          const d = done.includes(i); const av = open(city.id) && (i === 0 || done.includes(i - 1) || d);
          return <div className="mission" key={r.title}>
            <Image className="mission-state-icon" src={missionImage(i, d ? "completed" : av ? "continue" : "locked")} alt="" width={68} height={68} />
            <div>{r.title}<small>{d ? "Completed" : av ? "Ready to play" : "Locked · complete previous mission"}</small></div><b>{d ? "✓" : av ? "▶" : "🔒"}</b>
          </div>;
        })}
        <br /><button className="btn" disabled={!open(city.id)} onClick={() => enterCity(city.id)}>{open(city.id) ? "Explore Destination →" : "🔒 Destination Locked"}</button>
      </div>
    </div>
    <StampCollection />
  </>;
}
