"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";
import { MobileNav } from "@/components/layout/MobileNav";

export const TPT_URL = "https://www.teacherspayteachers.com/store/teacher-angelica";
export const YOUTUBE_URL = "https://www.youtube.com/@angelicamarielahenriquezva3854/videos";

/** V10 header: logo, tagline, TPT/YouTube, XP / gems / streak pills, home. */
export function TopBar({ menu = false }: { menu?: boolean }) {
  const { player, progress, go, navigate } = useLewta();
  return <header className="top">
    <div className="brand" onClick={() => go("welcome")} style={{ cursor: "pointer" }} role="button" tabIndex={0} aria-label="LEWTA welcome screen"
      onKeyDown={(e) => { if (e.key === "Enter") go("welcome"); }}>
      <Image src={IMAGES.branding.lewtaLogo} alt="LEWTA" width={145} height={54} priority />
    </div>
    <div className="tagline">✦ Learn English with Teacher Angélica ✦</div>
    <div className="top-right">
      <a className="social-top" href={TPT_URL} target="_blank" rel="noopener noreferrer"><span className="tpt-mark">✣</span><b>TPT</b></a>
      <a className="social-top" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"><span className="yt-mark">▶</span><b>YouTube</b></a>
      {player && <>
        <span className="pill">⭐ {progress.xp.toLocaleString()} XP</span>
        <button className="pill" title="Open accessories shop" onClick={() => go("profile")} style={{ cursor: "pointer", border: 0 }}>💎 <span id="gem-balance">{progress.gems}</span></button>
        <span className="pill">🔥 {progress.streak}</span>
      </>}
      <button className="iconbtn" title="Home" onClick={() => (player ? navigate("learn") : go("welcome"))}>⌂</button>
      {menu && <MobileNav />}
    </div>
  </header>;
}
