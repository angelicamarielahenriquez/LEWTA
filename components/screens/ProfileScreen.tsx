"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { StampCollection } from "@/components/screens/StampCollection";
import { accessoryImage, alienImage } from "@/lib/assets";
import { accessories, aliens, cityDecks, cityName } from "@/lib/gameData";
import { levelOf } from "@/lib/progress";

/** V10 "My Profile": passport photo, gem shop and alien collection. */
export function ProfileScreen() {
  const { player, progress, selectedAlien, equipped, selectAlien, equipAccessory, buyAccessory, saveBio, resetProgress, go, teacherPreviewMode } = useLewta();
  const [tab, setTab] = useState<"aliens" | "accessories">("aliens");
  const [bio, setBio] = useState(progress.bio || "");
  const [saved, setSaved] = useState(false);
  const pending = Object.entries(progress.missedPairIds).reduce((n, [c, ids]) => n + ids.filter((id) => (cityDecks[c] || []).some((p) => p.id === id)).length, 0);
  const isAccount = player?.storageMode === "supabase";
  // Teacher Mode: every alien and accessory can be inspected and tried on. Nothing is saved.
  const [tryAlien, setTryAlien] = useState("");
  const [tryAccessory, setTryAccessory] = useState("");
  const shownAlien = (teacherPreviewMode && aliens.find((a) => a.id === tryAlien)) || selectedAlien;
  const shownAccessory = (teacherPreviewMode && accessories.find((a) => a.id === tryAccessory)) || equipped;
  const ownsAlien = (id: string) => teacherPreviewMode || progress.unlockedAliens.includes(id);
  const ownsAccessory = (id: string) => teacherPreviewMode || progress.unlockedAccessories.includes(id);
  const alienChosen = (id: string) => (teacherPreviewMode ? shownAlien.id === id : progress.selectedAlien === id);
  const accessoryChosen = (id: string) => (teacherPreviewMode ? shownAccessory.id === id : progress.equippedAccessory === id);
  return <>
    <h1 className="section-title">My <span style={{ color: "#ff48a7" }}>Profile</span></h1>
    <p className="sub">Customize your passport photo, unlock aliens and shop for accessories!</p>
    <div className="two">
      <div className="panel profile-panel">
        <div className="eyebrow">👑 LEVEL {levelOf(progress.xp)} · PASSPORT PHOTO</div>
        <div className="alien-showcase">
          <Image className="alien-main" src={alienImage(shownAlien.id)} alt={shownAlien.name} width={220} height={220} priority />
          <div className="equipped-preview"><Image src={accessoryImage(shownAccessory.image)} alt={shownAccessory.name} width={57} height={57} /></div>
        </div>
        <h2>{shownAlien.name}</h2>
        <p className="small">{player ? `${player.firstName} ${player.lastName}` : "Your space companion"}</p>
        <p>Level progress · {progress.xp % 500}/500 XP</p>
        <div className="progressbar"><div style={{ width: `${(progress.xp % 500) / 5}%` }} /></div>
        <p>👽 {teacherPreviewMode ? aliens.length : progress.unlockedAliens.length} aliens &nbsp; 🎒 {teacherPreviewMode ? accessories.length : progress.unlockedAccessories.length} items</p>
        {teacherPreviewMode && <p className="teacher-test-note">TEACHER MODE · all aliens, accessories and stamps are open for inspection. Nothing is saved.</p>}
        <div className="passport-extras">
          {pending ? <><strong>⚠️ Pending: {pending} words to revisit</strong><p style={{ fontSize: 12 }}>Review difficult words to improve your English.</p><button onClick={() => go("revisit")}>Practice pending words →</button></>
            : <strong>🌟 No pending words — great work!</strong>}
          <label htmlFor="passport-bio">About me · Write something about yourself</label>
          <textarea id="passport-bio" maxLength={250} placeholder="My name is... I enjoy..." value={bio} disabled={teacherPreviewMode} onChange={(e) => { setBio(e.target.value); setSaved(false); }} />
          <button disabled={teacherPreviewMode} onClick={() => { saveBio(bio); setSaved(true); }}>Save description</button> <span className="bio-saved">{saved ? "✓ Saved" : ""}</span>
        </div>
      </div>
      <div className="panel">
        <div className="tabs">
          <button className={tab === "accessories" ? "selected" : ""} onClick={() => setTab("accessories")}>🎒 Accessories · Gem Shop</button>
          <button className={tab === "aliens" ? "selected" : ""} onClick={() => setTab("aliens")}>👽 My Aliens</button>
        </div>
        <h2>{tab === "aliens" ? "My Aliens" : "Accessories Shop"}</h2>
        <p className="sub">{tab === "aliens" ? "Choose your alien to appear on your passport photo." : "Unlock destinations to open new items, then buy them with gems. Completing a city gives you its special reward for free."}</p>
        <div className="gem-shop"><strong>💎 {progress.gems} gems</strong><span>· Your passport photo updates when you equip an item.</span></div>
        <div className="tiles">{tab === "aliens" ? aliens.map((a) => {
          const owned = ownsAlien(a.id);
          return <div key={a.id} className={`tile ${owned ? "active" : "locked"}`}>
            <Image src={alienImage(a.id)} alt={a.name} width={95} height={95} />
            <strong>{a.name} {owned ? "✓" : "🔒"}</strong>
            <small>{owned ? (alienChosen(a.id) ? "Selected" : teacherPreviewMode ? `Unlocks in ${cityName(a.unlockCity)}` : "Available") : `Unlock in ${cityName(a.unlockCity)}`}</small>
            {owned && <button className="btn ghost" disabled={alienChosen(a.id)} onClick={() => (teacherPreviewMode ? setTryAlien(a.id) : selectAlien(a.id))}>{alienChosen(a.id) ? "✓ Selected" : "Select"}</button>}
          </div>;
        }) : accessories.map((a) => {
          const owned = ownsAccessory(a.id);
          const cityOpen = progress.unlockedCities.includes(a.unlockCity);
          return <div key={a.id} className={`tile store-tile ${owned ? "active" : "locked"}`}>
            <Image src={accessoryImage(a.image)} alt={a.name} width={105} height={100} />
            <strong>{a.name}</strong>
            <small>{teacherPreviewMode ? `💎 ${a.cost} · ${cityName(a.unlockCity)}` : owned ? "Owned" : cityOpen ? `💎 ${a.cost} gems` : `🔒 Unlock ${cityName(a.unlockCity)}`}</small>
            {owned ? <button disabled={accessoryChosen(a.id)} onClick={() => (teacherPreviewMode ? setTryAccessory(a.id) : equipAccessory(a.id))}>{accessoryChosen(a.id) ? "✓ Equipped" : teacherPreviewMode ? "Try on" : "Equip"}</button>
              : <button disabled={teacherPreviewMode || !cityOpen || progress.gems < a.cost} onClick={() => buyAccessory(a.id)}>💎 {a.cost} · {cityOpen ? "Buy" : "Locked"}</button>}
          </div>;
        })}</div>
      </div>
    </div>
    <StampCollection />
    <div className="note profile-reset">
      <span>{isAccount ? "Using a shared or old device? This reloads your progress from your account. Nothing is deleted." : "Need a fresh start? This resets the guest progress saved on this device only."}</span>
      <button className="btn ghost" disabled={teacherPreviewMode} onClick={resetProgress}>{isAccount ? "Reload from my account" : "Reset guest progress"}</button>
    </div>
  </>;
}
