"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { NAV_ITEMS } from "@/components/layout/Sidebar";

/** Bottom menu shown on phones (the sidebar is hidden there). */
export function MobileNav() {
  const { page, navigate } = useLewta();
  return <nav className="mobile-nav" aria-label="Main (mobile)">
    {NAV_ITEMS.slice(0, 5).map((n) => <button key={n.id} className={(n.pages as readonly string[]).includes(page) ? "active" : ""} onClick={() => navigate(n.id)}>
      <Image src={n.icon} alt="" width={25} height={25} />{n.label.replace("My ", "").replace("Words to Revisit", "Revisit").replace("How to Play?", "Help")}
    </button>)}
  </nav>;
}
