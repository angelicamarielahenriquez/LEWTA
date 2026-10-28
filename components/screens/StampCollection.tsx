"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { cityStamp } from "@/lib/assets";
import { cities } from "@/lib/gameData";
import { isCityComplete } from "@/lib/progress";

/** V10 "My Stamp Collection". */
export function StampCollection() {
  const { progress, teacherPreviewMode } = useLewta();
  // Teacher Mode shows every stamp for inspection.
  const earned = cities.filter((c) => teacherPreviewMode || isCityComplete(progress, c.id));
  return <section className="panel stamp-collection" style={{ marginTop: 22 }}>
    <div className="stamp-collection-heading">
      <div><div className="eyebrow">🏅 YOUR ACHIEVEMENTS</div><h2>My Stamp Collection</h2><p className="sub">Your city icons stay in My Passport. Earn a separate collectible stamp by completing all five missions in each destination.</p></div>
      <div className="stamp-counter">{earned.length} / {cities.length} stamps earned</div>
    </div>
    <div className="stamp-collection-grid">{earned.length ? earned.map((c) => <div key={c.id} className="stamp-collectible">
      <Image className="collection-stamp" src={cityStamp(c.id)} alt={`${c.name} stamp`} width={105} height={110} />
      <strong>{c.name === "Panama City" ? "Panamá" : c.name}</strong><small>{teacherPreviewMode ? "Teacher preview" : "✓ Collected"}</small></div>)
      : <p>Complete your first city to receive your first stamp! ✨</p>}</div>
  </section>;
}
