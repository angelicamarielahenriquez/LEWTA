"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { NAV_ITEMS } from "@/components/layout/Sidebar";

/** V10 bottom menu on phones. */
export function MobileNav() {
  const { page, navigate } = useLewta();
  return <div className="mobile-nav">{NAV_ITEMS.slice(0, 5).map((n) => <button key={n.id} className={(n.pages as readonly string[]).includes(page) ? "active" : ""} onClick={() => navigate(n.id)}>
    <Image src={n.icon} alt="" width={25} height={25} />{n.label.replace("My ", "")}</button>)}</div>;
}
