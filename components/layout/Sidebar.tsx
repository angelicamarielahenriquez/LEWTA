"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES, alienImage } from "@/lib/assets";
import type { Page } from "@/types/lewta";

export const NAV_ITEMS = [
  { id: "learn", label: "Learn", icon: IMAGES.navigation.learn, pages: ["hub", "city", "game", "results"] },
  { id: "profile", label: "My Profile", icon: IMAGES.navigation.profile, pages: ["profile"] },
  { id: "passport", label: "My Passport", icon: IMAGES.navigation.passport, pages: ["passport"] },
  { id: "revisit", label: "Words to Revisit", icon: IMAGES.navigation.wordsToRevisit, pages: ["revisit"] },
  { id: "how", label: "How to Play?", icon: IMAGES.navigation.howToPlay, pages: ["how"] },
  { id: "teacher", label: "Teacher Dashboard", icon: IMAGES.navigation.teacherDashboard, pages: ["teacher", "teacher-login"] },
] as const satisfies readonly { id: string; label: string; icon: string; pages: readonly Page[] }[];

export function Sidebar() {
  const { page, navigate, player, selectedAlien } = useLewta();
  return <aside className="sidebar">
    <Image className="sidebar-logo" src={IMAGES.branding.businessCityLogo} alt="Business City" width={140} height={128} />
    <nav aria-label="Main">
      {NAV_ITEMS.map((n) => <button key={n.id} className={(n.pages as readonly string[]).includes(page) ? "active" : ""} onClick={() => navigate(n.id)}>
        <Image src={n.icon} alt="" width={29} height={29} />{n.label}
      </button>)}
      <button onClick={() => navigate("exit")}><Image src={IMAGES.navigation.exit} alt="" width={29} height={29} />Exit</button>
    </nav>
    {player && <div className="sidebar-user"><Image src={alienImage(selectedAlien.id)} alt={selectedAlien.name} width={40} height={40} /><span><b>{player.firstName}</b><small>{player.promotion}</small><small className="storage-line">{player.storageMode === "supabase" ? "☁️ Saved to your account" : "💾 Saved on this device"}</small></span></div>}
    <div className="teacher-credit"><Image src={IMAGES.branding.teacherAngelica} alt="Teacher Angélica" width={52} height={52} /><span>BY TEACHER ANGÉLICA</span></div>
  </aside>;
}
