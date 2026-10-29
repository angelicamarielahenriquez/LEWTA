"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { NAV_ITEMS } from "@/components/layout/Sidebar";

/**
 * Phone menu: a ☰ button in the header opens a dropdown with every section (including My Profile).
 * Tap ☰ again, tap outside, press Escape, or choose a section to close it. Desktop keeps the V10 sidebar.
 */
export function MobileNav() {
  const { page, navigate } = useLewta();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className="mobile-menu" ref={box}>
    <button className={`mobile-menu-btn ${open ? "open" : ""}`} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-menu-list" onClick={() => setOpen((v) => !v)}>
      <span /><span /><span />
    </button>
    {open && <nav id="mobile-menu-list" className="mobile-menu-list" aria-label="Main menu">
      {NAV_ITEMS.map((n) => <button key={n.id} className={(n.pages as readonly string[]).includes(page) ? "active" : ""} onClick={() => { setOpen(false); navigate(n.id); }}>
        <Image src={n.icon} alt="" width={30} height={30} /><span>{n.label}</span></button>)}
    </nav>}
  </div>;
}
