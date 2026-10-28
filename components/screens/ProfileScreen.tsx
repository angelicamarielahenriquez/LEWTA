"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { StampCollection } from "@/components/screens/StampCollection";
import { accessoryImage, alienImage } from "@/lib/assets";
import { accessories, aliens, cityName, cityDecks } from "@/lib/gameData";
import { levelOf } from "@/lib/progress";

export function ProfileScreen() {
  const { player, progress, selectedAlien, equipped, selectAlien, equipAccessory, buyAccessory, saveBio, resetProgress, go, teacherPreviewMode } = useLewta();
  const [tab, setTab] = useState<"aliens" | "accessories">("aliens");
  const [bio, setBio] = useState(progress.bio || "");
  const pending = Object.entries(progress.missedPairIds).reduce((n, [c, ids]) => n + ids.filter((id) => (cityDecks[c] || []).some((p) => p.id === id)).length, 0);
  const isAccount = player?.storageMode === "supabase";
  return <>
    <h1 className="section-title">My <em>Profile</em></h1>
    <p className="sub">Customize your passport photo, unlock aliens and shop for accessories!</p>
    <div className="two">
      <div className="panel profile-panel">
        <div className="eyebrow">👑 LEVEL {levelOf(progress.xp)} · PASSPORT PHOTO</div>
        <div className={`alien-showcase alien-${selectedAlien.color}`}>
          <Image className="alien-main" src={alienImage(selectedAlien.id)} alt={`${selectedAlien.name}, your alien`} width={225} height={225} priority />
          <div className="equipped-preview" title={`Equipped: ${equipped.name}`}><Image src={accessoryImage(equipped.image)} alt={`Equipped: ${equipped.name}`} width={57} height={57} /></div>
        </div>
        <h2>{selectedAlien.name}</h2>
        <p className="small">{player?.firstName} {player?.lastName} · {isAccount ? "☁️ saved to your account" : "💾 guest, saved on this device"}</p>
        <p>Level progress · {progress.xp % 500}/500 XP</p>
        <div className="progressbar"><div style={{ width: `${(progress.xp % 500) / 5}%` }} /></div>
        <p>👽 {progress.unlockedAliens.length} aliens · 🎒 {progress.unlockedAccessories.length} items</p>
        <div className="passport-extras">
          {pending > 0 ? <><strong>⚠️ Pending: {pending} words to revisit</strong><p className="small">Review difficult words to improve your English.</p><button onClick={() => go("revisit")}>Practice pending words →</button></> : <strong>🌟 No pending words — great work!</strong>}
          <label htmlFor="passport-bio">About me · Write something about yourself</label>
          <textarea id="passport-bio" maxLength={250} placeholder="My name is... I enjoy..." value={bio} onChange={(e) => setBio(e.target.value)} disabled={teacherPreviewMode} />
          <button onClick={() => saveBio(bio)} disabled={teacherPreviewMode}>Save description</button>
        </div>
      </div>
      <div className="panel">
        <div className="tabs">
          <button className={tab === "aliens" ? "selected" : ""} onClick={() => setTab("aliens")}>👽 My Aliens</button>
          <button className={tab === "accessories" ? "selected" : ""} onClick={() => setTab("accessories")}>🎒 Accessories · Gem Shop</button>
        </div>
        {tab === "aliens" ? <>
          <h2>My Aliens</h2><p className="sub">Each destination you complete brings a new alien. Choose one for your passport photo.</p>
          <div className="tiles">{aliens.map((a) => {
            const owned = progress.unlockedAliens.includes(a.id);
            return <div key={a.id} className={`tile ${owned ? "active" : "locked"} ${progress.selectedAlien === a.id ? "chosen" : ""}`}>
              <Image src={alienImage(a.id)} alt={owned ? a.name : `${a.name} (locked)`} width={95} height={95} />
              <strong>{a.name} {owned ? "✓" : "🔒"}</strong>
              <small>{owned ? (progress.selectedAlien === a.id ? "Selected" : "Available") : `Complete ${cityName(a.unlockCity)}`}</small>
              {owned && progress.selectedAlien !== a.id && <button className="btn ghost small-btn" disabled={teacherPreviewMode} onClick={() => selectAlien(a.id)}>Select</button>}
            </div>;
          })}</div>
        </> : <>
          <h2>Accessories Shop</h2><p className="sub">Unlock a destination to buy its items with gems. Completing a city gives you its special reward for free.</p>
          <div className="gem-shop"><strong>💎 {progress.gems} gems</strong><span>· Your passport photo updates when you equip an item.</span></div>
          <div className="tiles">{accessories.map((a) => {
            const owned = progress.unlockedAccessories.includes(a.id);
            const cityOpen = progress.unlockedCities.includes(a.unlockCity);
            return <div key={a.id} className={`tile store-tile ${owned ? "active" : cityOpen ? "" : "locked"}`}>
              <Image src={accessoryImage(a.image)} alt={a.name} width={100} height={100} />
              <strong>{a.name}</strong>
              <small>{owned ? (progress.equippedAccessory === a.id ? "Equipped" : "Owned") : cityOpen ? `💎 ${a.cost} gems` : `🔒 Unlock ${cityName(a.unlockCity)}`}</small>
              {owned ? <button disabled={teacherPreviewMode || progress.equippedAccessory === a.id} onClick={() => equipAccessory(a.id)}>{progress.equippedAccessory === a.id ? "✓ Equipped" : "Equip"}</button>
                : <button disabled={teacherPreviewMode || !cityOpen || progress.gems < a.cost} onClick={() => buyAccessory(a.id)}>{cityOpen ? `Buy · ${a.cost} 💎` : "Locked"}</button>}
            </div>;
          })}</div>
        </>}
      </div>
    </div>
    <StampCollection />
    <div className="panel reset-row">
      <div><b>{isAccount ? "Using a shared or old device?" : "Need a fresh start?"}</b>
        <p className="small">{isAccount ? "This reloads your progress from your account. Nothing in your account is deleted." : "This resets the guest progress saved on this device only."}</p></div>
      <button className={isAccount ? "btn ghost" : "btn danger"} disabled={teacherPreviewMode} onClick={resetProgress}>{isAccount ? "Reload from my account" : "Reset guest progress"}</button>
    </div>
  </>;
}
