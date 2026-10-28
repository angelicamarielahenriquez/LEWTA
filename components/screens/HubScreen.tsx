"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";

/** V10 "What would you like to learn today?" */
export function HubScreen() {
  const { progress, openCityOfSynonyms } = useLewta();
  const cards: [string, string, string, string][] = [
    [IMAGES.games.grammarQuest, "GRAMMAR QUEST", "pink", "Build your grammar skills for the real world!"],
    [IMAGES.games.cityOfSynonyms, "CITY OF SYNONYMS", "blue", "12 cities · 5 exciting challenges"],
    [IMAGES.games.readingLab, "READING LAB", "purple", "Improve reading and comprehension!"],
  ];
  return <>
    <div className="hero">
      <div><div className="eyebrow">LEWTA · YOUR ENGLISH UNIVERSE</div><h1>What would you like to <em>learn today?</em></h1><p>Choose a mission, collect rewards, and boost your English!</p></div>
      <Image className="hero-rocket" src={IMAGES.branding.lewtaLogo} alt="" width={200} height={140} />
    </div>
    <div className="cards">{cards.map(([img, title, tone, text], i) => <div key={title} className={`game-card ${tone}`}>
      {i !== 1 && <div className="ribbon">🔒 COMING SOON</div>}
      <Image src={img} alt={title} width={300} height={210} />
      <h3>{title}</h3><small>{text}</small>
      <button className={`btn ${i === 1 ? "yellow" : "ghost"}`} disabled={i !== 1} onClick={i === 1 ? openCityOfSynonyms : undefined}>{i === 1 ? "🚀 PLAY" : "COMING SOON"}</button>
    </div>)}</div>
    <div className="stats">
      <div className="stat"><b>⭐ {progress.xp.toLocaleString()}</b><span>Total XP</span></div>
      <div className="stat"><b>💎 {progress.gems}</b><span>Gems</span></div>
      <div className="stat"><b>🔥 {progress.streak}</b><span>Day streak</span></div>
      <div className="stat"><b>🛂 {progress.unlockedCities.length}/12</b><span>Destinations unlocked</span></div>
    </div>
    <div className="note">🌟 Small steps, stellar progress. Keep learning and reach for the stars!</div>
  </>;
}
