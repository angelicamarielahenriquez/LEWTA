"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";

export const TPT_URL = "https://www.teacherspayteachers.com/store/teacher-angelica";
export const YOUTUBE_URL = "https://www.youtube.com/@angelicamarielahenriquezva3854/videos";

export function TopBar() {
  const { player, progress, audio, setAudio, go, navigate } = useLewta();
  return <header className="top">
    <button className="brand" onClick={() => (player ? navigate("learn") : go("welcome"))} aria-label="LEWTA home">
      <Image src={IMAGES.branding.lewtaLogo} alt="LEWTA" width={150} height={56} priority />
    </button>
    <div className="tagline">✦ Learn English with Teacher Angélica ✦</div>
    <div className="top-right">
      <a className="social-top" href={TPT_URL} target="_blank" rel="noopener noreferrer"><span className="tpt-mark">✣</span><b>TPT</b></a>
      <a className="social-top" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer"><span className="yt-mark">▶</span><b>YouTube</b></a>
      {player && <>
        <span className="pill" title="Total XP"><Image src={IMAGES.rewards.xp} alt="" width={22} height={22} />{progress.xp.toLocaleString()}</span>
        <button className="pill pill-button" title="Gems — open the accessories shop" onClick={() => go("profile")}><Image src={IMAGES.rewards.gems} alt="" width={22} height={22} />{progress.gems}</button>
        <span className="pill" title="Day streak"><Image src={IMAGES.rewards.streak} alt="" width={22} height={22} />{progress.streak}</span>
      </>}
      <div className="volume" title="Music and sound volume">
        <button className="iconbtn" onClick={() => setAudio({ muted: !audio.muted })} aria-label={audio.muted ? "Turn sound on" : "Mute sound"}>{audio.muted || audio.volume === 0 ? "🔇" : "🔊"}</button>
        <input type="range" min={0} max={1} step={0.05} value={audio.muted ? 0 : audio.volume} aria-label="Volume"
          onChange={(e) => setAudio({ volume: Number(e.target.value), muted: Number(e.target.value) === 0 })} />
      </div>
    </div>
  </header>;
}
