/**
 * Welcome-screen comments ("Let your comments here").
 * If Teacher Angélica has run supabase/optional_visitor_comments.sql, comments are sent to
 * Supabase and appear in the Teacher Dashboard. Otherwise they are kept on this device only.
 */
import { supabase } from "@/lib/supabase";

export type VisitorComment = { name: string; message: string; date: string };

export async function submitComment(name: string, message: string): Promise<"cloud" | "local"> {
  const clean = { name: name.trim().slice(0, 60) || "Anonymous", message: message.trim().slice(0, 1000) };
  if (supabase) {
    try {
      const { error } = await supabase.from("visitor_comments").insert({ name: clean.name, message: clean.message });
      if (!error) return "cloud";
    } catch { /* fall back to local */ }
  }
  try {
    const list = JSON.parse(localStorage.getItem("lewta_visitor_comments") || "[]") as VisitorComment[];
    list.push({ ...clean, date: new Date().toISOString() });
    localStorage.setItem("lewta_visitor_comments", JSON.stringify(list.slice(-100)));
  } catch { /* ignore */ }
  return "local";
}

export function readLocalComments(): VisitorComment[] {
  try { const v = JSON.parse(localStorage.getItem("lewta_visitor_comments") || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
}
