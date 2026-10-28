"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { cityStamp } from "@/lib/assets";
import { cities } from "@/lib/gameData";
import { isCityComplete } from "@/lib/progress";

/** Collectible stamps: one per city, earned by completing all five missions. */
export function StampCollection() {
  const { progress } = useLewta();
  const earned = cities.filter((c) => isCityComplete(progress, c.id));
  return <section className="panel stamp-collection">
    <div className="stamp-collection-heading">
      <div><div className="eyebrow">🏅 YOUR ACHIEVEMENTS</div><h2>My Stamp Collection</h2><p className="sub">Earn a collectible stamp by completing all five missions in each destination.</p></div>
      <div className="stamp-counter">{earned.length} / {cities.length} stamps earned</div>
    </div>
    <div className="stamp-collection-grid">
      {earned.length ? earned.map((c) => <div key={c.id} className="stamp-collectible">
        <Image className="collection-stamp" src={cityStamp(c.id)} alt={`${c.name} stamp`} width={110} height={110} />
        <strong>{c.name}</strong><small>✓ Collected</small>
      </div>) : <p>Complete your first city to receive your first stamp! ✨</p>}
    </div>
  </section>;
}
