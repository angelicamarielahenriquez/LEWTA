"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { TPT_URL, YOUTUBE_URL } from "@/components/layout/TopBar";
import { IMAGES } from "@/lib/assets";
import { submitComment } from "@/lib/comments";

/** Teacher Angélica's original welcome screen with clickable areas, as in the V10 design. */
export function WelcomeScreen() {
  const { go, playWelcomeMusic, isMusicPlaying, audio, setAudio } = useLewta();
  const [choicesOpen, setChoicesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [commentStatus, setCommentStatus] = useState("");
  const [sending, setSending] = useState(false);

  const toggleMusic = () => {
    if (audio.muted) setAudio({ muted: false });
    playWelcomeMusic();
    setTimeout(() => setMusicOn(isMusicPlaying()), 50);
  };
  async function sendComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const message = String(fd.get("message") || "").trim();
    if (!message) { setCommentStatus("Please write your comment."); return; }
    setSending(true);
    const where = await submitComment(String(fd.get("name") || ""), message);
    setSending(false);
    setCommentStatus(where === "cloud" ? "Thank you! Teacher Angélica will read your comment. 💌" : "Thank you! Your comment was saved on this device.");
    e.currentTarget.reset();
  }

  return <div className="landing-wrap">
    <h1 className="sr-only">Welcome to LEWTA — Learning English with Teacher Angélica</h1>
    <div className="landing-picture">
      <Image src={IMAGES.backgrounds.landingScreen} alt="LEWTA: Learning English with Teacher Angélica. A pink rocket, planets and Teacher Angélica's introduction." fill priority sizes="100vw" />
      <a className="landing-hit landing-tpt" href={TPT_URL} target="_blank" rel="noopener noreferrer" aria-label="Teacher Angélica's TPT store" />
      <a className="landing-hit landing-youtube" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="Teacher Angélica's YouTube channel" />
      <button className="landing-hit landing-start" aria-label="Click here to start" onClick={() => setChoicesOpen(true)} />
      <button className="landing-hit landing-comments" aria-label="Leave your comments" onClick={() => { setCommentStatus(""); setCommentsOpen(true); }} />
      <button className="landing-sound" onClick={toggleMusic} aria-label="Turn the welcome music on or off">{musicOn && !audio.muted ? "🔊 Music" : "🔇 Music"}</button>
    </div>
    <div className="landing-mobile-actions">
      <button className="btn" onClick={() => setChoicesOpen(true)}>▶ CLICK HERE TO START</button>
      <button className="btn cyan" onClick={() => { setCommentStatus(""); setCommentsOpen(true); }}>💌 LEAVE YOUR COMMENTS</button>
    </div>

    {choicesOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="choices-title" onClick={() => setChoicesOpen(false)}>
      <div className="landing-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setChoicesOpen(false)} aria-label="Close">✕</button>
        <h2 id="choices-title">Ready to explore LEWTA? 🚀</h2>
        <p>Choose how you want to start.</p>
        <button className="choice-pink" onClick={() => go("register")}>👾 CREATE ACCOUNT</button>
        <button className="choice-pink" onClick={() => go("login")}>👽 I ALREADY HAVE AN ACCOUNT</button>
        <button className="choice-cyan" onClick={() => go("guest")}>🚀 CONTINUE AS A GUEST</button>
        <small>Guest progress is saved only on this device. Create an account to keep your progress on any device.</small>
      </div>
    </div>}

    {commentsOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="comments-title" onClick={() => setCommentsOpen(false)}>
      <form className="comments-dialog" onClick={(e) => e.stopPropagation()} onSubmit={(e) => void sendComment(e)}>
        <button type="button" className="modal-close dark" onClick={() => setCommentsOpen(false)} aria-label="Close">✕</button>
        <h2 id="comments-title">💌 Share your feedback!</h2>
        <p>Tell Teacher Angélica what you think of LEWTA.</p>
        <label>Your name (optional)<input name="name" maxLength={60} autoComplete="name" /></label>
        <label>Your comment<textarea name="message" maxLength={1000} required rows={4} /></label>
        <button className="pink-action" disabled={sending}>{sending ? "Sending…" : "Send my comment"}</button>
        {commentStatus && <p className="comment-status" role="status">{commentStatus}</p>}
      </form>
    </div>}
  </div>;
}
