"use client";
/**
 * LEWTA main controller: holds the app state and the game actions, then shows the right screen.
 * The screens themselves live in /components. Game rules live in /lib.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { LewtaContext, type LewtaApi } from "@/components/LewtaContext";
import { recordStudentActivity } from "@/lib/activity";
import { AUDIO, cityMusic } from "@/lib/assets";
import { AudioController, loadAudioSettings, saveAudioSettings, type AudioSettings } from "@/lib/audio";
import { accountCacheKey, loadAccount, localProgressKey, readLocal, saveCloudProgress, writeLocal } from "@/lib/cloudProgress";
import { accessories, aliens, cities, cityDecks, cityName, playOrder, roundInfo } from "@/lib/gameData";
import { applyMissionComplete, defaultProgress, describeRecovery, mergeProgress, migrateLegacyProgress, type RecoveryReport } from "@/lib/progress";
import { buildRoundPairs, createQuestionOptions, normalizeAnswer, shuffle } from "@/lib/questions";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { createMeteors, hitMeteor as hitMeteorAt, stepMeteors, waveOutcome, type Meteor } from "@/lib/reviewRush";
import { loadTeacherData, type TeacherRow } from "@/lib/teacher";
import type { VisitorComment } from "@/lib/comments";
import type { GameMode, GameResult, GameState, Page, Pair, Player, Progress } from "@/types/lewta";

const freshGame = (mode: GameMode, roundIndex: number, pairs: Pair[]): GameState => ({
  mode, roundIndex, pairs, matched: [], leftCards: shuffle(pairs), rightCards: shuffle(pairs), selectedLeft: null, selectedRight: null,
  questionIndex: 0, options: [], input: "", answered: false, answerCorrect: null, chosenValue: "", removed: [], hearts: 3, mistakes: 0,
  correctAnswers: 0, elapsed: 0, total: pairs.length, meteors: [], waveDone: false, over: false, points: 0,
});
const sameProgress = (a: Progress, b: Progress) => JSON.stringify({ ...a, updatedAt: "" }) === JSON.stringify({ ...b, updatedAt: "" });
const stamp = (p: Progress): Progress => ({ ...p, updatedAt: new Date().toISOString() });

function recoveryMessage(r: RecoveryReport) {
  const parts: string[] = [];
  if (r.aliens.length) parts.push(`${r.aliens.length} alien${r.aliens.length > 1 ? "s" : ""} (${r.aliens.map((id) => aliens.find((a) => a.id === id)?.name).join(", ")})`);
  if (r.cities.length) parts.push(`${r.cities.length} destination${r.cities.length > 1 ? "s" : ""}`);
  if (r.accessories.length) parts.push(`${r.accessories.length} city reward${r.accessories.length > 1 ? "s" : ""}`);
  return parts.length ? `Good news! We restored ${parts.join(", ")} that you had already earned.` : "";
}

export default function Home() {
  const [page, setPage] = useState<Page>("welcome");
  const [player, setPlayer] = useState<Player | null>(null);
  const [progress, setProgress] = useState<Progress>(defaultProgress);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [guestFormError, setGuestFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeCityId, setActiveCityId] = useState("new-york");
  const [game, setGame] = useState<GameState | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [audio, setAudioState] = useState<AudioSettings>(() => (typeof window === "undefined" ? { muted: false, volume: 0.7 } : loadAudioSettings()));
  const [teacherRows, setTeacherRows] = useState<TeacherRow[]>([]);
  const [teacherComments, setTeacherComments] = useState<VisitorComment[]>([]);
  const [teacherAuthorized, setTeacherAuthorized] = useState(false);
  const [teacherAccessConfigured, setTeacherAccessConfigured] = useState(true);
  const [teacherAuthError, setTeacherAuthError] = useState("");
  /** Teacher Mode = the server confirmed this signed-in account is the teacher. It unlocks everything for testing and never saves progress. */
  // Only a signed-in account can be in Teacher Mode; a guest never is (even in the same browser tab).
  const teacherPreviewMode = teacherAuthorized && player?.storageMode === "supabase";

  const audioRef = useRef<AudioController | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameRef = useRef<GameState | null>(null);
  /** Mirrors `paused` without waiting for a render, so the meteor loop stops on the very next frame. */
  const pausedRef = useRef(false);
  const pausePlay = useCallback((v: boolean) => { pausedRef.current = v; setPaused(v); }, []);
  const progressRef = useRef<Progress>(progress);
  const playerRef = useRef<Player | null>(null);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloudErrorShown = useRef(false);

  const activeCity = cities.find((c) => c.id === activeCityId) || cities[0];
  const activeDeck = cityDecks[activeCity.id] || cityDecks["new-york"] || [];
  const roundDone = progress.completedRounds[activeCity.id] || [];
  const selectedAlien = aliens.find((a) => a.id === progress.selectedAlien) || aliens[0];
  const equipped = accessories.find((a) => a.id === progress.equippedAccessory) || accessories[0];

  // Review Rush updates gameRef itself on every frame (it must never be rolled back to an older render).
  useEffect(() => { if (!game || game.mode !== "review") gameRef.current = game; }, [game]);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { playerRef.current = player; }, [player]);

  // ---------- notices and sound ----------
  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 4500);
  }, []);
  const sound = () => {
    if (!audioRef.current) audioRef.current = new AudioController();
    return audioRef.current;
  };
  useEffect(() => {
    sound().apply(audio);
    return () => { sound().stopMusic(); if (noticeTimer.current) clearTimeout(noticeTimer.current); };
    // Runs once on start; later changes go through setAudio().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setAudio = useCallback((next: Partial<AudioSettings>) => {
    setAudioState((prev) => { const s = { ...prev, ...next }; saveAudioSettings(s); sound().apply(s); return s; });
  }, []);
  const playEffect: LewtaApi["playEffect"] = useCallback((name, level = 0.45) => sound().effect(name, level), []);
  const [musicTrack, setMusicTrack] = useState("");
  const lastTrack = useRef("lewta");
  const playTrack = useCallback((track: string) => {
    const src = track === "lewta" ? AUDIO.lewtaTheme : track === "review" ? AUDIO.reviewRush : cityMusic(track);
    sound().playMusic(src, track === "review" ? 0.22 : track === "lewta" ? 0.25 : 0.16);
    lastTrack.current = track; setMusicTrack(track);
  }, []);
  const playCityMusic = useCallback((cityId: string, review = false) => {
    playTrack(review ? "review" : cityId);
  }, [playTrack]);
  const stopMusic = useCallback(() => { sound().stopMusic(); setMusicTrack(""); }, []);

  // ---------- saving progress ----------
  const updateProgress = useCallback((updater: (prev: Progress) => Progress) => {
    if (teacherPreviewMode) return;
    setProgress((prev) => stamp(updater(prev)));
  }, [teacherPreviewMode]);

  useEffect(() => {
    if (!player || teacherPreviewMode) return;
    if (player.storageMode === "supabase" && player.authUserId) {
      writeLocal(accountCacheKey(player.authUserId), progress);
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
      const userId = player.authUserId;
      cloudTimer.current = setTimeout(() => {
        void saveCloudProgress(userId, progressRef.current).then((merged) => {
          cloudErrorShown.current = false;
          // If another device added achievements, bring them into this screen too.
          if (!sameProgress(merged, progressRef.current)) setProgress((cur) => mergeProgress(cur, merged));
        }).catch((error: unknown) => {
          console.warn("LEWTA cloud progress sync failed:", error);
          if (!cloudErrorShown.current) { cloudErrorShown.current = true; showNotice("Your progress is saved on this device and will sync to your account when the connection returns."); }
        });
      }, 1200);
    } else {
      writeLocal(localProgressKey(player.username), progress);
    }
  }, [progress, player, teacherPreviewMode, showNotice]);

  const flushCloudSave = useCallback(async () => {
    const p = playerRef.current;
    if (cloudTimer.current) { clearTimeout(cloudTimer.current); cloudTimer.current = null; }
    if (p?.storageMode === "supabase" && p.authUserId) {
      try { await saveCloudProgress(p.authUserId, progressRef.current); } catch (e) { console.warn("Final cloud save failed:", e); }
    }
  }, []);

  // ---------- starting the app (restoring a session) ----------
  const enterAccount = useCallback(async (user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }, previous: Player | null, isNewSession: boolean) => {
    const samePerson = previous?.authUserId === user.id || (previous?.storageMode !== "supabase" && previous?.email && previous.email === user.email);
    const legacyLocal = samePerson && previous ? readLocal(localProgressKey(previous.username)) : null;
    const loaded = await loadAccount(user, { sessionId: samePerson && !isNewSession ? previous?.sessionId : undefined, legacyLocal });
    setPlayer(loaded.player); setProgress(loaded.progress); setPage("hub");
    try { localStorage.setItem("lewta_session", JSON.stringify(loaded.player)); } catch { /* ignore */ }
    if (isNewSession || !samePerson) recordStudentActivity(loaded.player, "session-start", { studentType: "Account" }, loaded.progress);
    return loaded;
  }, []);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      let saved: Player | null = null;
      try { const raw = localStorage.getItem("lewta_session"); if (raw) saved = JSON.parse(raw) as Player; } catch { saved = null; }

      const resumeLocal = (p: Player) => {
        const key = localProgressKey(p.username);
        let raw: unknown = null;
        try { raw = JSON.parse(localStorage.getItem(key) || "null"); } catch { raw = null; }
        const restored = raw ? migrateLegacyProgress(raw) : defaultProgress();
        const session = { ...p, sessionId: p.sessionId || crypto.randomUUID() };
        try { localStorage.setItem("lewta_session", JSON.stringify(session)); } catch { /* ignore */ }
        setPlayer(session); setProgress(restored); setPage("hub");
        const msg = recoveryMessage(describeRecovery(raw, restored));
        if (msg) showNotice(msg);
      };

      if (isSupabaseConfigured && supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.warn("Could not restore Supabase session:", error.message);
        const user = session?.user;
        if (typeof window !== "undefined" && /[?&]code=/.test(window.location.search)) window.history.replaceState({}, "", window.location.pathname);
        if (user) {
          try {
            const loaded = await enterAccount(user, saved, saved?.authUserId !== user.id);
            if (cancelled) return;
            const msg = recoveryMessage(loaded.recovered);
            if (msg) showNotice(msg);
            else if (saved?.authUserId !== user.id) showNotice(`Welcome, ${loaded.player.firstName || "explorer"}! Your progress is saved to your account.`);
            return;
          } catch (err: unknown) {
            if (cancelled) return;
            console.warn("Could not restore LEWTA cloud profile:", err);
            if (saved?.role === "guest") resumeLocal({ ...saved, storageMode: "guest" });
            showNotice(err instanceof Error ? err.message : "Supabase account setup needs attention. Continue as Guest remains available.");
            return;
          }
        }
        if (saved?.role === "guest") resumeLocal({ ...saved, storageMode: "guest" });
        else if (saved) localStorage.removeItem("lewta_session"); // cached accounts must sign in again
        return;
      }
      if (saved?.storageMode === "supabase") {
        localStorage.removeItem("lewta_session");
        showNotice("Supabase account mode is not configured in this build. Sign in after setup, or choose Continue as Guest.");
        return;
      }
      if (saved) resumeLocal({ ...saved, storageMode: saved.role === "guest" ? "guest" : (saved.storageMode || "legacy-local") });
    };
    void restore().catch((e: unknown) => console.warn("LEWTA startup restore failed:", e));
    return () => { cancelled = true; };
  }, [enterAccount, showNotice]);

  // ---------- timer ----------
  const finishRef = useRef<(passed: boolean, timedOut?: boolean) => void>(() => {});
  useEffect(() => {
    if (page !== "game" || !game || game.over || game.mode === "match" || game.mode === "context" || (game.answered && game.mode !== "review") || timeLeft <= 0 || paused) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) { setTimeLeft(0); finishRef.current(false, true); }
      else setTimeLeft((v) => v - 1);
    }, 1000);
    return () => clearTimeout(t);
    // The countdown only depends on these values; including the whole game object would restart the second on every click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, game?.mode, game?.answered, game?.questionIndex, timeLeft, paused]);

  // ---------- navigation ----------
  const clearAuthMessages = useCallback(() => { setAuthError(""); setAuthMessage(""); setGuestFormError(""); }, []);
  const go = useCallback((p: Page) => { clearAuthMessages(); setPage(p); if (typeof window !== "undefined") window.scrollTo({ top: 0 }); }, [clearAuthMessages]);

  // ---------- accounts ----------
  async function register(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); clearAuthMessages(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("firstName") || "").trim(); const lastName = String(fd.get("lastName") || "").trim();
    const username = String(fd.get("username") || "").trim().toLowerCase(); const promotion = String(fd.get("promotion") || "2026");
    const email = String(fd.get("email") || "").trim().toLowerCase();
    const password = String(fd.get("password") || ""); const confirm = String(fd.get("confirmPassword") || "");
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("Accounts are not connected yet. You can still play now with Continue as Guest.");
      if (!firstName || !lastName || !username || !email || !password) throw new Error("Please complete all required fields.");
      if (!/^[a-zA-Z0-9._-]{3,20}$/.test(username)) throw new Error("Username must be 3–20 characters: letters, numbers, dots, dashes or underscores.");
      if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
      if (password !== confirm) throw new Error("Your passwords do not match.");
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { first_name: firstName, last_name: lastName, username, promotion } } });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Supabase did not return a user. Please try again.");
      if (!data.session) { setAuthMessage("✅ Your account was created! Open the confirmation email and click the link. Then come back to THIS page and sign in below with your email and password. (If the link opens a grey error page, that is OK — your account is already confirmed.)"); setPage("login"); return; }
      await enterAccount(data.user, null, true);
      setActiveCityId("new-york"); playEffect("levelUp"); showNotice(`Welcome to LEWTA, ${firstName}! Your progress will be saved to your account.`);
    } catch (err: unknown) { setAuthError(err instanceof Error ? err.message : "We couldn't create your account. Please try again."); }
    finally { setBusy(false); }
  }

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); clearAuthMessages(); setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim().toLowerCase(); const password = String(fd.get("password") || "");
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("Accounts are not connected yet. Continue as Guest works without them.");
      if (!email || !password) throw new Error("Enter your email address and password.");
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Supabase did not return a user. Please try again.");
      let saved: Player | null = null;
      try { saved = JSON.parse(localStorage.getItem("lewta_session") || "null"); } catch { saved = null; }
      const loaded = await enterAccount(data.user, saved, true);
      const msg = recoveryMessage(loaded.recovered);
      showNotice(msg || `Welcome back, ${loaded.player.firstName || "explorer"}! Your progress has been restored.`);
      playEffect("click", 0.3);
    } catch (err: unknown) { setAuthError(err instanceof Error ? err.message : "Log in failed."); }
    finally { setBusy(false); }
  }

  async function loginWithGoogle() {
    clearAuthMessages();
    if (!isSupabaseConfigured || !supabase) { setAuthError("Accounts are not connected yet. You can still play with Continue as Guest."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) {
      setBusy(false);
      setAuthError(/provider is not enabled|Unsupported provider/i.test(error.message)
        ? "Google sign-in is not switched on yet. Teacher Angélica needs to enable Google in Supabase (see the setup guide). Please use email for now."
        : error.message);
    }
  }

  function startAsGuest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setGuestFormError("");
    const fd = new FormData(e.currentTarget);
    const firstName = String(fd.get("firstName") || "").trim(); const lastName = String(fd.get("lastName") || "").trim();
    if (!firstName || !lastName) { setGuestFormError("Please enter both your first name and last name."); return; }
    const guestId = crypto.randomUUID(); const sessionId = crypto.randomUUID(); const username = `guest-${guestId.slice(0, 8)}`;
    const guest: Player = { id: guestId, guestId, sessionId, firstName, lastName, username, promotion: "Guest", role: "guest", storageMode: "guest" };
    const next = stamp(defaultProgress());
    try {
      localStorage.setItem("lewta_session", JSON.stringify(guest));
      localStorage.setItem(`lewta_profile_${username}`, JSON.stringify({ firstName, lastName, username, promotion: "Guest", role: "guest", guestId, sessionId }));
    } catch { /* guest mode still works in memory */ }
    recordStudentActivity(guest, "session-start", { firstName, lastName });
    // Starting a guest game always closes any teacher session that was open in this browser.
    if (teacherAuthorized) { setTeacherAuthorized(false); setTeacherRows([]); void fetch("/api/teacher-auth", { method: "DELETE" }).catch(() => undefined); }
    setPlayer(guest); setProgress(next); setActiveCityId("new-york"); setPage("hub"); clearAuthMessages();
    showNotice(`Welcome, ${firstName}! Your guest progress is saved on this device.`);
    playEffect("click", 0.28);
  }

  async function logout() {
    recordStudentActivity(player, "session-end", {}, progressRef.current);
    await flushCloudSave();
    if (teacherAuthorized) { try { await fetch("/api/teacher-auth", { method: "DELETE" }); } catch { /* ignore */ } }
    if (player?.storageMode === "supabase" && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn("Supabase sign-out failed:", error.message);
    }
    stopMusic();
    try { localStorage.removeItem("lewta_session"); } catch { /* ignore */ }
    setPlayer(null); setProgress(defaultProgress()); setGame(null); setTeacherAuthorized(false); setTeacherRows([]); setPage("welcome"); clearAuthMessages();
  }

  // ---------- words to revisit ----------
  const addMiss = useCallback((cityId: string, ids: number[]) => {
    if (teacherPreviewMode || !ids.length) return;
    updateProgress((prev) => {
      const counts = { ...(prev.masteryCounts[cityId] || {}) };
      ids.forEach((id) => { counts[String(id)] = 0; });
      return { ...prev, missedPairIds: { ...prev.missedPairIds, [cityId]: Array.from(new Set([...(prev.missedPairIds[cityId] || []), ...ids])) }, masteryCounts: { ...prev.masteryCounts, [cityId]: counts } };
    });
  }, [teacherPreviewMode, updateProgress]);

  const markMastered = useCallback((cityId: string, id: number) => {
    if (teacherPreviewMode) return;
    updateProgress((prev) => {
      const counts = { ...(prev.masteryCounts[cityId] || {}) };
      const count = (counts[String(id)] || 0) + 1;
      counts[String(id)] = count;
      // A missed word stays in Words to Revisit until two correct answers in a row.
      const mastered = count >= 2;
      return {
        ...prev,
        masteryCounts: { ...prev.masteryCounts, [cityId]: counts },
        masteredPairIds: mastered ? { ...prev.masteredPairIds, [cityId]: Array.from(new Set([...(prev.masteredPairIds[cityId] || []), id])) } : prev.masteredPairIds,
        missedPairIds: mastered ? { ...prev.missedPairIds, [cityId]: (prev.missedPairIds[cityId] || []).filter((x) => x !== id) } : prev.missedPairIds,
      };
    });
  }, [teacherPreviewMode, updateProgress]);

  // ---------- missions ----------
  function enterCity(cityId: string) {
    if (!teacherPreviewMode && !progress.unlockedCities.includes(cityId)) { showNotice("Complete all five missions in your current city to unlock this destination."); playEffect("click", 0.18); return; }
    setActiveCityId(cityId); go("city");
    if (!teacherPreviewMode) recordStudentActivity(player, "city-visit", { cityId, cityName: cityName(cityId) }, progress);
    playEffect("click", 0.2); playCityMusic(cityId);
  }
  function openCityOfSynonyms() {
    const current = progress.unlockedCities.includes(activeCityId) ? activeCityId : playOrder.filter((c) => progress.unlockedCities.includes(c)).at(-1) || "new-york";
    enterCity(current);
  }

  function startGame(roundIndex: number) {
    const info = roundInfo[roundIndex];
    const pairs = buildRoundPairs(activeCity.id, roundIndex, progress.missedPairIds[activeCity.id] || []);
    const next = freshGame(info.mode, roundIndex, pairs);
    if (info.mode === "boss" || info.mode === "review") next.options = createQuestionOptions(pairs[0], activeDeck);
    if (info.mode === "review") { next.meteors = createMeteors(next.options); rushPairFailed.current = false; }
    pausePlay(false); setGame(next); gameRef.current = next; setGameResult(null); setTimeLeft(info.time || 0); setPage("game");
    if (!teacherPreviewMode) recordStudentActivity(player, "game-start", { cityId: activeCity.id, roundIndex, title: info.title, questionCount: pairs.length }, progress);
    playCityMusic(activeCity.id, info.mode === "review"); playEffect("click", 0.28);
  }
  function leaveGame() { setGame(null); gameRef.current = null; pausePlay(false); setPage("city"); playCityMusic(activeCity.id); }

  function finishGame(passed: boolean, timedOut = false) {
    const g = gameRef.current;
    if (!g) return; // already finished (prevents double rewards)
    gameRef.current = null;
    pausePlay(false); setGame(null);
    const cityId = activeCity.id;
    const correct = g.mode === "match" || g.mode === "speed" ? g.matched.length : g.correctAnswers;
    let result: GameResult = { passed, timedOut, correct, total: g.total, roundIndex: g.roundIndex, cityId, xpEarned: 0, gemsEarned: 0, replay: false };
    if (!passed && timedOut && !teacherPreviewMode) {
      // Unanswered words go to Words to Revisit.
      const unresolved = g.mode === "match" || g.mode === "speed" ? g.pairs.filter((p) => !g.matched.includes(p.id)).map((p) => p.id) : g.pairs.slice(g.questionIndex).filter((p) => !p.businessQuestion).map((p) => p.id);
      addMiss(cityId, unresolved);
    }
    if (!teacherPreviewMode) recordStudentActivity(player, "game-finish", { cityId, roundIndex: g.roundIndex, title: roundInfo[g.roundIndex].title, passed, correct, total: g.total, score: Math.max(0, correct * 100 - g.mistakes * 10), timedOut }, progressRef.current);
    if (teacherPreviewMode) { showNotice("Teacher testing mode: student progress and rewards were not changed."); }
    else if (passed) {
      const done = applyMissionComplete(progressRef.current, cityId, g.roundIndex);
      const next = stamp(done.progress);
      progressRef.current = next; setProgress(next);
      result = { ...result, xpEarned: done.xpEarned, gemsEarned: done.gemsEarned, replay: done.replay, newCityId: done.newCityId, newAlienId: done.newAlienId, newAccessoryId: done.newAccessoryId };
      const parts: string[] = [];
      if (done.newAlienId) parts.push(`New alien unlocked: ${aliens.find((a) => a.id === done.newAlienId)?.name}!`);
      if (done.newCityId) parts.push(`New destination: ${cityName(done.newCityId)}!`);
      if (done.newAccessoryId) parts.push(`City reward: ${accessories.find((a) => a.id === done.newAccessoryId)?.name}.`);
      if (parts.length) showNotice(parts.join(" "));
      else if (done.cityComplete && !done.replay) showNotice("City complete! You conquered all five missions.");
    }
    setGameResult(result); setPage("results");
    stopMusic();
    if (passed) playEffect(result.newCityId || result.newAlienId ? "levelUp" : "celebrate", 0.55);
    else if (timedOut) playEffect("timeUp", 0.65);
  }
  useEffect(() => { finishRef.current = finishGame; });

  function setGameInput(value: string) { setGame((prev) => (prev ? { ...prev, input: value } : prev)); }
  function togglePause() { pausePlay(!pausedRef.current); }

  function submitAnswer(value: string) {
    const g = game;
    if (!g || g.answered) return;
    const pair = g.pairs[g.questionIndex];
    let submitted = String(value || "").trim();
    if (!submitted) { showNotice(g.mode === "context" ? "Type the complete answer before submitting." : "Choose A, B, C or D before submitting."); return; }
    let evaluated = submitted; let right: boolean;
    if (g.mode === "boss") {
      const letter = submitted.toUpperCase(); const idx = letter.length === 1 ? letter.charCodeAt(0) - 65 : -1; const sel = g.options[idx];
      if (!sel) { showNotice("Choose A, B, C or D before submitting."); return; }
      evaluated = sel.value; right = sel.correct; submitted = letter;
    } else {
      // Context Match: the complete phrase, ignoring capital letters and extra spaces.
      right = normalizeAnswer(submitted) === normalizeAnswer(pair.b);
    }
    setGame((prev) => (prev ? { ...prev, input: submitted, answered: true, answerCorrect: right, chosenValue: evaluated, mistakes: prev.mistakes + (right ? 0 : 1), correctAnswers: prev.correctAnswers + (right ? 1 : 0) } : prev));
    if (!teacherPreviewMode && !pair.businessQuestion) { if (right) markMastered(activeCity.id, pair.id); else addMiss(activeCity.id, [pair.id]); }
    if (!teacherPreviewMode) recordStudentActivity(player, "answer", { cityId: activeCity.id, roundIndex: g.roundIndex, questionIndex: g.questionIndex, correct: right, completed: true, answer: evaluated, expected: pair.b });
    playEffect(right ? "correct" : "incorrect", 0.6);
  }
  function nextQuestion() {
    const g = game; if (!g) return;
    if (g.questionIndex >= g.pairs.length - 1) { finishGame(true); return; }
    const i = g.questionIndex + 1;
    setGame((prev) => (prev ? { ...prev, questionIndex: i, options: createQuestionOptions(prev.pairs[i], activeDeck), input: "", answered: false, answerCorrect: null, chosenValue: "", elapsed: prev.elapsed + 1 } : prev));
  }
  function chooseMatchLeft(pairId: number) {
    if (!game || game.matched.includes(pairId)) return;
    setGame((prev) => (prev ? { ...prev, selectedLeft: pairId } : prev)); playEffect("click", 0.18);
  }
  function chooseMatchRight(pairId: number) {
    const g = game;
    if (!g || g.matched.includes(pairId) || g.selectedLeft === null) return;
    const left = g.selectedLeft;
    if (left === pairId) {
      const matched = [...g.matched, pairId];
      const next = { ...g, matched, selectedLeft: null, selectedRight: null };
      setGame(next); gameRef.current = next;
      if (!teacherPreviewMode) { markMastered(activeCity.id, pairId); recordStudentActivity(player, "answer", { cityId: activeCity.id, roundIndex: g.roundIndex, pairId, correct: true, completed: true }); }
      playEffect("correct", 0.5);
      if (matched.length >= g.pairs.length) setTimeout(() => finishRef.current(true), 450);
    } else {
      if (!teacherPreviewMode) { addMiss(activeCity.id, [left]); recordStudentActivity(player, "answer", { cityId: activeCity.id, roundIndex: g.roundIndex, pairId: left, correct: false, completed: false }); }
      playEffect("incorrect", 0.5);
      setGame((prev) => (prev ? { ...prev, selectedRight: pairId, mistakes: prev.mistakes + 1 } : prev));
      setTimeout(() => setGame((prev) => (prev ? { ...prev, selectedLeft: null, selectedRight: null } : prev)), 650);
    }
  }
  // ---------- Review Rush (falling meteors kept in game state) ----------
  const rushPairFailed = useRef(false);
  function commitRush(g: GameState, meteors: Meteor[], livesLost: number, notice?: string) {
    const pair = g.pairs[g.questionIndex];
    let next: GameState = { ...g, meteors, hearts: g.hearts - livesLost, mistakes: g.mistakes + livesLost };
    if (livesLost > 0) {
      playEffect("incorrect", 0.6);
      if (!rushPairFailed.current && !teacherPreviewMode) { addMiss(activeCity.id, [pair.id]); recordStudentActivity(player, "answer", { cityId: activeCity.id, roundIndex: g.roundIndex, pairId: pair.id, correct: false, completed: true }); }
      rushPairFailed.current = true;
      if (notice) showNotice(notice);
    }
    if (next.hearts <= 0) {
      next = { ...next, hearts: 0, over: true };
      gameRef.current = next; setGame(next); playEffect("timeUp", 0.6);
      if (!teacherPreviewMode) recordStudentActivity(player, "game-finish", { cityId: activeCity.id, roundIndex: g.roundIndex, title: roundInfo[g.roundIndex].title, passed: false, correct: g.correctAnswers, total: g.total, score: g.points, timedOut: false }, progressRef.current);
      return;
    }
    const outcome = waveOutcome(meteors);
    if (outcome !== "pending" && !g.waveDone) {
      next = { ...next, waveDone: true };
      if (outcome === "success") {
        next = { ...next, correctAnswers: next.correctAnswers + 1, points: next.points + 20 };
        playEffect("correct", 0.6);
        if (!teacherPreviewMode) { markMastered(activeCity.id, pair.id); recordStudentActivity(player, "answer", { cityId: activeCity.id, roundIndex: g.roundIndex, pairId: pair.id, correct: true, completed: true }); }
      }
      const index = g.questionIndex;
      setTimeout(() => {
        const cur = gameRef.current;
        if (!cur || cur.mode !== "review" || cur.over || cur.questionIndex !== index) return;
        if (index >= cur.pairs.length - 1) { finishRef.current(true); return; }
        const i = index + 1; const options = createQuestionOptions(cur.pairs[i], activeDeck);
        const upd: GameState = { ...cur, questionIndex: i, options, meteors: createMeteors(options), waveDone: false };
        rushPairFailed.current = false; gameRef.current = upd; setGame(upd);
      }, 1300);
    }
    gameRef.current = next; setGame(next);
  }
  function hitMeteor(id: string) {
    const g = gameRef.current;
    if (!g || g.mode !== "review" || pausedRef.current || g.over || g.waveDone) return;
    const hit = hitMeteorAt(g.meteors, id);
    if (!hit.kind) return;
    if (hit.kind === "destroyed") {
      playEffect("click", 0.35);
      if (!teacherPreviewMode) recordStudentActivity(player, "answer", { cityId: activeCity.id, roundIndex: g.roundIndex, pairId: g.pairs[g.questionIndex].id, correct: false, completed: false, removedWrongOption: true });
      commitRush({ ...g, points: g.points + 10 }, hit.meteors, 0);
    } else commitRush(g, hit.meteors, 1, "That was the correct synonym! You lost a life — let it fall next time.");
  }
  // Game loop: moves the meteors while Review Rush is running (stops when paused, finished or over).
  useEffect(() => {
    if (page !== "game" || game?.mode !== "review" || paused || game.over || game.waveDone) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now(); const dt = Math.min(0.12, (now - last) / 1000); last = now;
      const g = gameRef.current;
      if (!g || g.mode !== "review" || g.over || g.waveDone || pausedRef.current) { last = now; return; }
      const step = stepMeteors(g.meteors, dt);
      if (step.missed) commitRush(g, step.meteors, step.missed, step.missed > 1 ? `${step.missed} wrong meteors reached the ground. You lost ${step.missed} lives.` : "A wrong meteor reached the ground. You lost a life.");
      else commitRush(g, step.meteors, 0);
    }, 40);
    return () => window.clearInterval(id);
    // The loop restarts only when the wave or pause state changes; positions are read from gameRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, game?.mode, game?.over, game?.waveDone, game?.questionIndex, paused]);

  // ---------- profile ----------
  function selectAlien(id: string) { if (progress.unlockedAliens.includes(id)) { updateProgress((p) => ({ ...p, selectedAlien: id })); playEffect("click", 0.2); } }
  function equipAccessory(id: string) { if (progress.unlockedAccessories.includes(id)) { updateProgress((p) => ({ ...p, equippedAccessory: id })); playEffect("click", 0.2); } }
  function buyAccessory(id: string) {
    const item = accessories.find((a) => a.id === id); if (!item || teacherPreviewMode) return;
    if (progress.unlockedAccessories.includes(id)) { equipAccessory(id); return; }
    if (!progress.unlockedCities.includes(item.unlockCity)) { showNotice(`Unlock ${cityName(item.unlockCity)} first.`); return; }
    if (progress.gems < item.cost) { showNotice(`You need ${item.cost} gems for ${item.name}.`); return; }
    updateProgress((p) => (p.unlockedAccessories.includes(id) || p.gems < item.cost ? p : { ...p, gems: p.gems - item.cost, unlockedAccessories: [...p.unlockedAccessories, id], equippedAccessory: id }));
    playEffect("levelUp", 0.4); showNotice(`${item.name} unlocked and equipped!`);
  }
  function saveBio(text: string) { updateProgress((p) => ({ ...p, bio: text.slice(0, 250) })); showNotice("Your description was saved."); }
  function resetProgress() {
    if (teacherPreviewMode || !player) return;
    if (player.storageMode === "supabase" && player.authUserId) {
      // Account progress lives in the cloud: this only refreshes this device's copy. Nothing is deleted.
      if (!window.confirm("Refresh this device's copy of your progress from your account? Your saved progress will NOT be deleted.")) return;
      const userId = player.authUserId;
      void (async () => {
        try {
          if (!supabase) return;
          const { data } = await supabase.auth.getUser();
          if (!data.user || data.user.id !== userId) throw new Error("Please log in again.");
          localStorage.removeItem(accountCacheKey(userId));
          const loaded = await loadAccount(data.user, { sessionId: player.sessionId, legacyLocal: null });
          setProgress(loaded.progress); showNotice("This device now shows the progress saved in your account.");
        } catch (e) { showNotice(e instanceof Error ? e.message : "Could not refresh from your account."); }
      })();
      return;
    }
    if (!window.confirm("Reset this guest profile's XP, gems, cities and progress on this device? This cannot be undone.")) return;
    const fresh = stamp(defaultProgress());
    setProgress(fresh); writeLocal(localProgressKey(player.username), fresh); setActiveCityId("new-york"); setGame(null); setGameResult(null); setPage("hub"); stopMusic();
    showNotice("Your guest progress on this device has been reset.");
  }

  // ---------- teacher ----------
  async function accessToken(): Promise<string | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }
  async function reloadTeacherRows() {
    const { rows, comments, notice: n } = await loadTeacherData(await accessToken());
    setTeacherRows(rows); setTeacherComments(comments); if (n) showNotice(n);
  }
  /** Asks the server whether the signed-in account is the teacher (never decided in the browser). */
  const checkTeacherAccess = useCallback(async (announce: boolean) => {
    setTeacherAuthError("");
    if (!supabase || player?.storageMode !== "supabase") { setTeacherAuthorized(false); return false; }
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) { setTeacherAuthorized(false); return false; }
      const r = await fetch("/api/teacher-auth", { method: "GET", cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
      const result = await r.json().catch(() => ({}));
      setTeacherAccessConfigured(result.configured !== false);
      const isTeacher = r.ok && result.teacher === true;
      setTeacherAuthorized(isTeacher);
      if (!isTeacher && result.error) setTeacherAuthError(String(result.error));
      if (isTeacher && announce) showNotice("Teacher Mode is on: all 12 cities and 60 missions are open for testing. Nothing you do here changes student progress.");
      // Without the password step the teacher's account plays like any student (progressive unlocking).
      return isTeacher;
    } catch { setTeacherAuthorized(false); setTeacherAuthError("Could not contact the teacher access service."); return false; }
  }, [player?.storageMode, showNotice]);
  // Re-check whenever a different account signs in.
  useEffect(() => {
    if (!player?.authUserId) return;
    const id = window.setTimeout(() => void checkTeacherAccess(true), 0);
    return () => window.clearTimeout(id);
  }, [player?.authUserId, checkTeacherAccess]);
  async function openTeacherDashboard() {
    const ok = teacherAuthorized || await checkTeacherAccess(false);
    if (ok) { setPage("teacher"); await reloadTeacherRows(); }
    else setPage("teacher-login");
  }
  async function teacherLogin(password: string) {
    setTeacherAuthError("");
    try {
      const token = await accessToken();
      if (!token) { setTeacherAuthError("Log in with your teacher account first."); return; }
      const r = await fetch("/api/teacher-auth", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) });
      const result = await r.json().catch(() => ({}));
      setTeacherAccessConfigured(result.configured !== false);
      if (!r.ok || result.teacher !== true) { setTeacherAuthorized(false); setTeacherAuthError(String(result.error || "Teacher authentication failed.")); return; }
      setTeacherAuthorized(true); setPage("teacher"); await reloadTeacherRows();
      showNotice("Teacher Mode is on: all 12 cities, 60 missions, aliens, stamps and songs are open for testing. Nothing you do here is saved.");
    } catch { setTeacherAuthError("Could not contact the teacher sign-in service."); }
  }
  async function teacherLogout() {
    try { await fetch("/api/teacher-auth", { method: "DELETE" }); } catch { /* ignore */ }
    setTeacherAuthorized(false); setTeacherRows([]); setGame(null); stopMusic(); setPage(player ? "hub" : "welcome");
    showNotice("Teacher Dashboard locked. Your account is back to normal progress.");
  }
  function startTeacherTest(cityId: string) { if (!teacherAuthorized) return; setActiveCityId(cityId); setGame(null); setGameResult(null); setPage("city"); playCityMusic(cityId); }
  function exitTeacherTest() { stopMusic(); setPage("teacher"); void reloadTeacherRows(); }

  function navigate(dest: "learn" | "profile" | "passport" | "revisit" | "how" | "teacher" | "exit") {
    playEffect("click", 0.18);
    if (musicTrack === "review") stopMusic();
    if (dest === "learn") go("hub");
    else if (dest === "profile") go("profile");
    else if (dest === "passport") go("passport");
    else if (dest === "revisit") go("revisit");
    else if (dest === "how") go("how");
    else if (dest === "teacher") void openTeacherDashboard();
    else void logout();
  }

  const api: LewtaApi = {
    page, player, progress, busy, authError, authMessage, guestFormError, activeCity, activeDeck, roundDone, selectedAlien, equipped,
    game, gameResult, timeLeft, paused, audio, teacherPreviewMode, teacherAuthorized: teacherPreviewMode, teacherAccessConfigured, teacherAuthError, teacherRows, teacherComments,
    go, navigate, showNotice, clearAuthMessages,
    register: (e) => void register(e), login: (e) => void login(e), loginWithGoogle: () => void loginWithGoogle(), startAsGuest, logout: () => void logout(),
    enterCity, openCityOfSynonyms, startGame, leaveGame, togglePause, chooseMatchLeft, chooseMatchRight, setGameInput, submitAnswer, nextQuestion, hitMeteor,
    markMastered, addMiss, selectAlien, equipAccessory, buyAccessory, saveBio, resetProgress,
    setAudio, playEffect, musicTrack,
    chooseTrack: (track) => { if (track === "lewta" || progress.unlockedCities.includes(track) || teacherPreviewMode) { if (audio.muted) setAudio({ muted: false }); playTrack(track); } },
    toggleMusic: () => { if (musicTrack) stopMusic(); else { if (audio.muted) setAudio({ muted: false }); playTrack(lastTrack.current || "lewta"); } },
    openTeacherDashboard: () => void openTeacherDashboard(), teacherLogin: (p) => void teacherLogin(p), teacherLogout: () => void teacherLogout(),
    reloadTeacherRows: () => void reloadTeacherRows(), startTeacherTest, exitTeacherTest,
  };
  return <LewtaContext.Provider value={api}><AppShell notice={notice} onCloseNotice={() => setNotice("")} /></LewtaContext.Provider>;
}
