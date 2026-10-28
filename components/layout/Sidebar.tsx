"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";
import type { Page } from "@/types/lewta";

export const NAV_ITEMS = [
  { id: "learn", label: "Learn", icon: IMAGES.navigation.learn, pages: ["hub"] },
  { id: "profile", label: "My Profile", icon: IMAGES.navigation.profile, pages: ["profile"] },
  { id: "passport", label: "My Passport", icon: IMAGES.navigation.passport, pages: ["passport"] },
  { id: "revisit", label: "Words to Revisit", icon: IMAGES.navigation.wordsToRevisit, pages: ["revisit"] },
  { id: "how", label: "How to Play?", icon: IMAGES.navigation.howToPlay, pages: ["how"] },
  { id: "teacher", label: "Teacher Dashboard", icon: IMAGES.navigation.teacherDashboard, pages: ["teacher", "teacher-login"] },
  { id: "exit", label: "Exit / Welcome", icon: IMAGES.navigation.exit, pages: [] },
] as const satisfies readonly { id: string; label: string; icon: string; pages: readonly Page[] }[];

/** V10 side menu. */
export function Sidebar() {
  const { page, navigate, player } = useLewta();
  return <aside>
    <Image className="sidebar-logo" src={IMAGES.branding.businessCityLogo} alt="Business City" width={125} height={115} />
    <nav>{NAV_ITEMS.map((n) => <button key={n.id} className={(n.pages as readonly string[]).includes(page) ? "active" : ""} onClick={() => navigate(n.id)}>
      <Image src={n.icon} alt="" width={29} height={29} />{n.label}</button>)}</nav>
    <div className="teacher">
      <Image src={IMAGES.branding.teacherAngelica} alt="Teacher Angélica" width={190} height={190} /><br />BY TEACHER ANGÉLICA<br />
      <small>{player ? `${player.firstName} · ${player.storageMode === "supabase" ? "saved to your account" : "guest, saved on this device"}` : "Learning English with Teacher Angélica"}</small>
    </div>
  </aside>;
}
