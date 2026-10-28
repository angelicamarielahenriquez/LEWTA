"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { TPT_URL, YOUTUBE_URL } from "@/components/layout/TopBar";
import { IMAGES } from "@/lib/assets";
import { submitComment } from "@/lib/comments";

/** V10 welcome: Teacher Angélica's landing picture with clickable areas. */
export function WelcomeScreen() {
  const { go, musicTrack, chooseTrack, toggleMusic, audio } = useLewta();
  const [choicesOpen, setChoicesOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const playing = musicTrack === "lewta" && !audio.muted;

  async function save() {
    if (!message.trim()) { setStatus("Please write your comment."); return; }
    const where = await submitComment(name, message);
    setStatus(where === "cloud" ? "Thank you! Teacher Angélica will read your comment. 💌" : "Thank you! Your comment was saved on this device.");
    setName(""); setMessage("");
  }

  return <>
    <div className="landing-wrap">
      <h1 className="sr-only">Welcome to LEWTA — Learning English with Teacher Angélica</h1>
      <div className="landing-picture">
        <Image src={IMAGES.backgrounds.landingScreen} alt="LEWTA welcome screen, Teacher Angelica and rocket" width={1920} height={1080} priority sizes="100vw" />
        <a className="landing-hit landing-tpt" href={TPT_URL} target="_blank" rel="noopener noreferrer" aria-label="Teacher Angelica TPT store" />
        <a className="landing-hit landing-youtube" href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="Teacher Angelica YouTube channel" />
        <button className="landing-hit landing-start" aria-label="Click here to start" onClick={() => setChoicesOpen(true)} />
        <button className="landing-hit landing-comments" aria-label="Comments" onClick={() => { setStatus(""); setCommentsOpen(true); }} />
        <button className="landing-sound" id="sound-toggle" onClick={() => (musicTrack === "lewta" ? toggleMusic() : chooseTrack("lewta"))} aria-label="Toggle background music">{playing ? "🔊 Music" : "🔇 Music"}</button>
      </div>
      <div className={`landing-choices ${choicesOpen ? "open" : ""}`} id="landing-choices">
        <div className="landing-dialog" role="dialog" aria-modal="true" aria-label="Choose how to start">
          <button className="landing-close" onClick={() => setChoicesOpen(false)} aria-label="Close">✕</button>
          <h2>Ready to explore LEWTA? 🚀</h2>
          <p>Choose how you want to start.</p>
          <button onClick={() => go("register")}>👾 CREATE ACCOUNT</button>
          <button onClick={() => go("login")}>👽 I ALREADY HAVE AN ACCOUNT</button>
          <button onClick={() => go("guest")}>🚀 CONTINUE AS A GUEST</button>
          <small>Guest progress stays on this device. Create an account to keep your progress everywhere.</small>
        </div>
      </div>
    </div>
    <div id="comments-modal" hidden={!commentsOpen}>
      <div className="comments-dialog" role="dialog" aria-modal="true" aria-label="Share your feedback">
        <button className="close-comments" onClick={() => setCommentsOpen(false)} aria-label="Close">✕</button>
        <h2>💌 Share your feedback!</h2>
        <p>Tell Teacher Angélica what you think of LEWTA.</p>
        <label htmlFor="comment-name">Your name (optional)</label>
        <input id="comment-name" placeholder="Your name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
        <label htmlFor="comment-message">Your comment</label>
        <textarea id="comment-message" rows={5} placeholder="I love... / I suggest..." maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
        <button className="pink-action" onClick={() => void save()}>Save my comment</button>
        <small>{status || "Your comment goes to Teacher Angélica."}</small>
      </div>
    </div>
  </>;
}
