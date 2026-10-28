"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";

/** "What would you like to learn today?" */
export function HubScreen() {
  const { progress, openCityOfSynonyms } = useLewta();
  const cards = [
    { img: IMAGES.games.grammarQuest, title: "GRAMMAR QUEST", tone: "pink", text: "Build your grammar skills for the real world!", soon: true },
    { img: IMAGES.games.cityOfSynonyms, title: "CITY OF SYNONYMS", tone: "blue", text: "12 cities · 5 exciting challenges", soon: false },
    { img: IMAGES.games.readingLab, title: "READING LAB", tone: "purple", text: "Improve reading and comprehension!", soon: true },
  ];
  return <>
    <section className="hero">
      <div><div className="eyebrow">LEWTA · YOUR ENGLISH UNIVERSE</div><h1>What would you like to <em>learn today?</em></h1><p>Choose a mission, collect rewards, and boost your English!</p></div>
      <Image className="hero-art" src={IMAGES.branding.lewtaLogo} alt="" width={220} height={150} />
    </section>
    <div className="cards">
      {cards.map((c) => <div key={c.title} className={`game-card ${c.tone}`}>
        <Image src={c.img} alt="" width={320} height={240} />
        <h3>{c.title}</h3><small>{c.text}</small>
        {c.soon ? <button className="btn ghost" disabled>COMING SOON</button> : <button className="btn yellow" onClick={openCityOfSynonyms}>🚀 PLAY</button>}
      </div>)}
    </div>
    <div className="stats">
      <div className="stat"><Image src={IMAGES.rewards.xp} alt="" width={40} height={40} /><b>{progress.xp.toLocaleString()}</b><span>Total XP</span></div>
      <div className="stat"><Image src={IMAGES.rewards.gems} alt="" width={40} height={40} /><b>{progress.gems}</b><span>Gems</span></div>
      <div className="stat"><Image src={IMAGES.rewards.streak} alt="" width={40} height={40} /><b>{progress.streak}</b><span>Day streak</span></div>
      <div className="stat"><span className="stat-emoji" aria-hidden="true">🛂</span><b>{progress.unlockedCities.length}/12</b><span>Destinations unlocked</span></div>
    </div>
    <div className="note">🌟 Small steps, stellar progress. Keep learning and reach for the stars!</div>
  </>;
}
