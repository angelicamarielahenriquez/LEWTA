"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES } from "@/lib/assets";
import { accessories, aliens, cities, cityDecks, cityName } from "@/lib/gameData";
import type { TeacherRow } from "@/lib/teacher";

const CODES = ["US", "PA", "GB", "JP", "FR", "MX", "AE", "SG", "IE", "JM", "ES", "BR"];

/** V10 private teacher area. Access is granted by the server to the teacher's own account — there is no shared password. */
export function TeacherLoginScreen() {
  const { player, teacherAccessConfigured, teacherAuthError, navigate, go, openTeacherDashboard } = useLewta();
  const signedIn = player?.storageMode === "supabase";
  return <div className="teacher-login">
    <div className="teacher-avatar"><Image src={IMAGES.navigation.teacherDashboard} alt="Teacher Angélica" width={88} height={88} /></div>
    <small>PRIVATE TEACHER AREA</small>
    <h2>Teacher Dashboard</h2>
    {!signedIn ? <p>Log in with your teacher account to review student progress and test every destination.</p>
      : <p>This area is only available to the teacher account. You are signed in as <b>{player?.email || player?.username}</b>, which is a student account.</p>}
    {!teacherAccessConfigured && <p className="auth-error">Teacher access is not configured on this server yet.</p>}
    {teacherAuthError && <p className="auth-error" role="alert">{teacherAuthError}</p>}
    {!signedIn ? <button className="pink-action" onClick={() => go("login")}>Log in with teacher account →</button>
      : <button className="pink-action" onClick={openTeacherDashboard}>Check my access again ↻</button>}
    <button type="button" onClick={() => navigate("learn")}>‹ Back to LEWTA</button>
  </div>;
}

export function TeacherScreen() {
  const { teacherRows, teacherComments, teacherLogout, reloadTeacherRows, startTeacherTest } = useLewta();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const rows = teacherRows.filter((r) => `${r.first_name} ${r.last_name} ${r.username} ${r.promotion}`.toLowerCase().includes(search.trim().toLowerCase()));
  const row = rows.find((r) => r.recordKey === selected) || rows[0];
  const done = (r: (typeof rows)[number]) => Object.values(r.game_progress?.completedRounds || {}).filter((x) => Array.isArray(x) && x.length >= 5).length;
  return <>
    <h1 className="section-title">Class <span style={{ color: "#ff48a7" }}>Progress</span></h1>
    <p className="sub">Review student performance and test all 12 destinations without changing learner progress.</p>
    <button className="btn ghost" onClick={teacherLogout}>← Back to LEWTA</button> <button className="btn ghost" onClick={reloadTeacherRows}>↻ Refresh</button>
    <div className="teacher-stats">
      <div>👥 <b>{teacherRows.length}</b><small>Students</small></div>
      <div>⭐ <b>{teacherRows.reduce((n, r) => n + (Number(r.xp) || 0), 0).toLocaleString()}</b><small>Total XP</small></div>
      <div>💎 <b>{teacherRows.reduce((n, r) => n + (Number(r.gems) || 0), 0).toLocaleString()}</b><small>Total gems</small></div>
    </div>
    <div className="note">Student accounts come from Supabase. Guest players are saved only in the browser they used.</div>
    <div className="panel" style={{ marginTop: 16 }}>
      <h2>Test any city and mission</h2><p className="sub">Teacher testing mode — no learner progress changes.</p>
      <div className="teacher-city-grid">{cities.map((c, i) => <button key={c.id} onClick={() => startTeacherTest(c.id)}><strong>{CODES[i]}</strong><br />{c.name}<small>Test city {i + 1} →</small></button>)}</div>
    </div>
    <div className="panel" style={{ marginTop: 16 }}>
      <h2>Student records</h2>
      <label htmlFor="teacher-search">Search students</label>
      <input id="teacher-search" className="teacher-search" placeholder="Name, username, or promotion" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="word-table">
        <div><strong>STUDENT</strong><span>TYPE / PROMOTION</span><span>XP</span><span>DESTINATIONS</span></div>
        {rows.map((r) => <div key={r.recordKey} className={row?.recordKey === r.recordKey ? "row-selected" : ""} onClick={() => setSelected(r.recordKey)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") setSelected(r.recordKey); }}>
          <strong>{r.first_name} {r.last_name}</strong><span>{r.student_type} · {r.promotion || "—"}</span><span>{(r.xp || 0).toLocaleString()}</span><span>{done(r)} done · {(r.game_progress?.unlockedCities || []).length || 1}/12</span></div>)}
        {!rows.length && <p className="sub">No students found.</p>}
      </div>
      {row && <StudentRecord row={row} />}
    </div>
    <div className="panel" style={{ marginTop: 16 }}>
      <h2>💌 Visitor comments</h2>
      {teacherComments.length ? <div className="word-table">{teacherComments.slice(0, 50).map((c, i) => <div key={i}><strong>{c.name}</strong><span style={{ gridColumn: "span 2" }}>{c.message}</span><span>{new Date(c.date).toLocaleDateString()}</span></div>)}</div>
        : <p className="sub">No comments yet.</p>}
    </div>
  </>;
}

/** One student's stored record. Only data that is actually saved is shown. */
function StudentRecord({ row }: { row: TeacherRow }) {
  const gp = (row.game_progress || {}) as Record<string, unknown>;
  const completed = (gp.completedRounds || {}) as Record<string, number[]>;
  const unlocked = Array.isArray(gp.unlockedCities) ? (gp.unlockedCities as string[]) : [];
  const missed = (gp.missedPairIds || {}) as Record<string, number[]>;
  const myAliens = Array.isArray(gp.unlockedAliens) ? (gp.unlockedAliens as string[]) : [];
  const myAccessories = Array.isArray(gp.unlockedAccessories) ? (gp.unlockedAccessories as string[]) : [];
  const answered = (row.correctAnswers || 0) + (row.incorrectAnswers || 0);
  const accuracy = answered ? Math.round(((row.correctAnswers || 0) / answered) * 100) : null;
  const stamps = cities.filter((c) => (completed[c.id] || []).length >= 5);
  const words = cities.flatMap((c) => (missed[c.id] || []).map((id) => ({ city: c.name, pair: cityDecks[c.id]?.find((p) => p.id === id) })).filter((w) => w.pair));
  const hasProgress = Object.keys(gp).length > 0;
  return <div className="student-record">
    <h3>Individual record · {row.first_name} {row.last_name} <small>({row.username} · {row.student_type})</small></h3>
    <div className="teacher-stats">
      <div>⭐ <b>{(row.xp || 0).toLocaleString()}</b><small>XP</small></div>
      <div>💎 <b>{row.gems || 0}</b><small>Gems</small></div>
      <div>🔥 <b>{row.streak || 0}</b><small>Day streak</small></div>
      <div>🎯 <b>{accuracy === null ? "—" : `${accuracy}%`}</b><small>Accuracy ({row.correctAnswers || 0} correct / {row.incorrectAnswers || 0} incorrect)</small></div>
      <div>🛂 <b>{stamps.length}/12</b><small>Stamps earned</small></div>
      <div>🕒 <b>{row.sessionEnd || row.sessionStart ? new Date(row.sessionEnd || row.sessionStart || "").toLocaleDateString() : "—"}</b><small>Last activity</small></div>
    </div>
    {!hasProgress && <p className="sub">No saved game progress for this student yet.</p>}
    {hasProgress && <>
      <h4>Cities and missions</h4>
      <div className="word-table">
        <div><strong>CITY</strong><span>STATUS</span><span>MISSIONS</span><span>WORDS TO REVISIT</span></div>
        {cities.map((c) => { const n = (completed[c.id] || []).length; const open = unlocked.includes(c.id) || c.id === "new-york";
          return <div key={c.id}><strong>{c.name}</strong><span>{n >= 5 ? "✅ Completed" : open ? (n ? "⏳ In progress" : "🌎 Unlocked") : "🔒 Locked"}</span><span>{n}/5</span><span>{(missed[c.id] || []).length}</span></div>; })}
      </div>
      <h4>Rewards</h4>
      <p>Aliens: {myAliens.length ? myAliens.map((id) => aliens.find((a) => a.id === id)?.name || id).join(", ") : "none yet"} · Accessories: {myAccessories.length ? myAccessories.map((id) => accessories.find((a) => a.id === id)?.name || id).join(", ") : "none yet"} · Stamps: {stamps.length ? stamps.map((c) => c.name).join(", ") : "none yet"}</p>
      <h4>Words to revisit ({words.length})</h4>
      {words.length ? <div className="word-table">{words.slice(0, 60).map((w, i) => <div key={i}><strong>{w.pair!.a}</strong><span>{w.pair!.b}</span><span>{w.pair!.spanish}</span><span>{w.city}</span></div>)}</div> : <p className="sub">No pending words.</p>}
    </>}
    <h4>Game results ({row.roundsPlayed?.length || 0} recorded)</h4>
    <p className="sub">Questions completed: {row.questionsCompleted || 0} · Attempts: {row.questionAttempts || 0}</p>
    {(row.roundsPlayed || []).length > 0 ? <div className="word-table">{[...row.roundsPlayed].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).slice(0, 40).map((r, i) =>
      <div key={`${r.startedAt}-${i}`}><strong>{cityName(r.cityId)}</strong><span>{r.title}</span><span>{r.finishedAt ? `${r.passed ? "Completed" : "Not passed"} · ${r.correct || 0}/${r.total || 0}${r.total ? ` (${Math.round(((r.correct || 0) / r.total) * 100)}%)` : ""}` : "Not finished"}</span><span>{new Date(r.finishedAt || r.startedAt).toLocaleDateString()}</span></div>)}</div>
      : <p className="sub">No game results recorded yet.</p>}
  </div>;
}
