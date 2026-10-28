"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { IMAGES, cityIcon } from "@/lib/assets";
import { cities, cityName } from "@/lib/gameData";

export function TeacherLoginScreen() {
  const { teacherLogin, teacherAccessConfigured, teacherAuthError, player, go } = useLewta();
  const [password, setPassword] = useState("");
  return <form className="teacher-login" onSubmit={(e) => { e.preventDefault(); teacherLogin(password); setPassword(""); }}>
    <div className="teacher-avatar"><Image src={IMAGES.branding.teacherAngelica} alt="Teacher Angélica" width={88} height={88} /></div>
    <small className="tiny-label">PRIVATE TEACHER AREA</small>
    <h2>Teacher Dashboard</h2>
    <p>Enter your teacher password to review student progress and test every destination.</p>
    {!teacherAccessConfigured && <div className="error-box">Teacher access is not configured yet. In Vercel, add <code>TEACHER_DASHBOARD_PASSWORD</code> and <code>TEACHER_DASHBOARD_SECRET</code>, then redeploy.</div>}
    {teacherAuthError && <div className="error-box" role="alert">{teacherAuthError}</div>}
    <label>Teacher password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter teacher password" required disabled={!teacherAccessConfigured} /></label>
    <button className="pink-action" disabled={!teacherAccessConfigured || !password.trim()}>Unlock Teacher Dashboard →</button>
    <button type="button" onClick={() => go(player ? "hub" : "welcome")}>‹ Back to LEWTA</button>
  </form>;
}

export function TeacherScreen() {
  const { teacherRows, teacherComments, teacherLogout, reloadTeacherRows, startTeacherTest } = useLewta();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const rows = teacherRows.filter((r) => `${r.first_name} ${r.last_name} ${r.username} ${r.promotion}`.toLowerCase().includes(search.trim().toLowerCase()));
  const row = rows.find((r) => r.recordKey === selected) || rows[0];
  const completedCities = (r: typeof row) => Object.values(r?.game_progress?.completedRounds || {}).filter((x) => Array.isArray(x) && x.length >= 5).length;
  return <>
    <div className="teacher-heading">
      <div><h1 className="section-title">Class <em>Progress</em></h1><p className="sub">Review student performance and test all 12 destinations without changing learner progress.</p></div>
      <button className="btn ghost" onClick={teacherLogout}>🔒 Lock Dashboard</button>
    </div>
    <div className="teacher-stats">
      <div>👥 <b>{teacherRows.length}</b><small>Students visible here</small></div>
      <div>⭐ <b>{teacherRows.reduce((n, r) => n + (Number(r.xp) || 0), 0).toLocaleString()}</b><small>Total XP</small></div>
      <div>💎 <b>{teacherRows.reduce((n, r) => n + (Number(r.gems) || 0), 0).toLocaleString()}</b><small>Total gems</small></div>
    </div>
    <div className="note"><b>Where the data comes from:</b> student accounts are loaded from Supabase. Guest players are saved only in the browser they used, so you see them only on that device.</div>
    <section className="panel">
      <h2>Test any city and mission</h2><p className="sub">Teacher testing mode — no student progress changes.</p>
      <div className="teacher-city-grid">{cities.map((c, i) => <button key={c.id} onClick={() => startTeacherTest(c.id)}>
        <Image src={cityIcon(c.id)} alt="" width={48} height={48} /><strong>{c.name}</strong><small>Test city {i + 1} →</small></button>)}</div>
    </section>
    <section className="panel">
      <div className="teacher-heading"><h2>Student records</h2><button className="btn ghost" onClick={reloadTeacherRows}>↻ Refresh</button></div>
      <label className="search-label">Search students<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, username, or promotion" /></label>
      <div className="word-table class-table">
        <div className="table-head"><strong>STUDENT</strong><span>TYPE / PROMOTION</span><span>XP · STREAK</span><span>CITIES DONE</span></div>
        {rows.map((r) => <button type="button" key={r.recordKey} className={row?.recordKey === r.recordKey ? "selected" : ""} onClick={() => setSelected(r.recordKey)}>
          <strong>{r.first_name} {r.last_name}<small>@{r.username}</small></strong><span>{r.student_type} · {r.promotion || "—"}</span><span>⭐ {r.xp || 0} · 🔥 {r.streak || 0}</span><span>{completedCities(r)}/12</span>
        </button>)}
        {!rows.length && <p className="small">No matching students yet.</p>}
      </div>
      {row && <div className="teacher-detail">
        <h3>{row.first_name} {row.last_name}</h3>
        <p className="small">@{row.username} · {row.student_type} · {row.sessions?.length || 0} session(s)</p>
        <div className="teacher-stats">
          <div><b>{row.questionsCompleted || 0}</b><small>Questions completed</small></div>
          <div><b>{row.correctAnswers || 0}</b><small>Correct answers</small></div>
          <div><b>{row.incorrectAnswers || 0}</b><small>Incorrect answers</small></div>
        </div>
        <h4>Rounds</h4>
        {(row.roundsPlayed || []).length ? <div className="round-list">{[...row.roundsPlayed].sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt))).slice(0, 60).map((r, i) =>
          <div key={`${r.cityId}-${r.roundIndex}-${r.startedAt}-${i}`}><b>{cityName(r.cityId)} · {r.title}</b><span>{r.finishedAt ? `${r.passed ? "Completed" : "Not passed"} · ${r.correct || 0}/${r.total || 0}` : "In progress"}</span><small>{new Date(r.finishedAt || r.startedAt).toLocaleString()}</small></div>)}</div>
          : <p className="small">No rounds recorded yet.</p>}
      </div>}
    </section>
    <section className="panel">
      <h2>💌 Visitor comments</h2>
      {teacherComments.length ? <div className="round-list">{teacherComments.slice(0, 50).map((c, i) => <div key={i}><b>{c.name}</b><span>{c.message}</span><small>{new Date(c.date).toLocaleString()}</small></div>)}</div>
        : <p className="small">No comments yet. (To receive comments from every device, run supabase/optional_visitor_comments.sql — see docs/SUPABASE_SETUP_GUIDE.md.)</p>}
    </section>
  </>;
}
