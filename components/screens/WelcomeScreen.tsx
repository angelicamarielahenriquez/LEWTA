"use client";
import Image from "next/image";
import { useState } from "react";
import { useLewta } from "@/components/LewtaContext";
import { TPT_URL, YOUTUBE_URL } from "@/components/layout/TopBar";
import { IMAGES } from "@/lib/assets";
import { submitComment } from "@/lib/comments";

/** Welcome screen rebuilt from the pieces of Teacher Angélica's Canva design: wide on computers, one column on phones. */
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
    <div className="landing-wrap lw">
      <h1 className="sr-only">Welcome to LEWTA — Learning English with Teacher Angélica</h1>
      <header className="lw-top">
        <div className="lw-social">
          <a href={TPT_URL} target="_blank" rel="noopener noreferrer" aria-label="Teacher Angelica TPT store"><Image src="/images/landing/tpt.png" alt="TPT" width={212} height={57} /></a>
          <span className="lw-divider" aria-hidden="true" />
          <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" aria-label="Teacher Angelica YouTube channel"><Image src="/images/landing/youtube.png" alt="YouTube" width={185} height={47} /></a>
        </div>
        <Image className="lw-tagline" src="/images/landing/tagline.png" alt="Learn English with Teacher Angélica" width={524} height={43} />
        <button className="landing-sound" id="sound-toggle" onClick={() => (musicTrack === "lewta" ? toggleMusic() : chooseTrack("lewta"))} aria-label="Toggle background music">{playing ? "🔊 Music" : "🔇 Music"}</button>
      </header>
      <main className="lw-main">
        <section className="lw-stage" aria-hidden="true">
          <svg className="lw-orbits" viewBox="0 0 600 500" preserveAspectRatio="none">
            <path d="M330 120 C 300 40, 180 50, 60 170" />
            <path d="M120 420 C 260 470, 420 430, 540 330" />
          </svg>
          <Image className="lw-planet lw-p1" src="/images/landing/planet-ring.png" alt="" width={149} height={148} />
          <Image className="lw-planet lw-p2" src="/images/backgrounds/planet-2.png" alt="" width={160} height={160} />
          <Image className="lw-planet lw-p3" src="/images/landing/planet-stripes.png" alt="" width={156} height={152} />
          <span className="lw-spark lw-s1" /><span className="lw-spark lw-s2" /><span className="lw-spark lw-s3" /><span className="lw-spark lw-s4 pink" />
          <span className="lw-dot d1" /><span className="lw-dot d2" /><span className="lw-dot d3" /><span className="lw-dot d4" /><span className="lw-dot d5" />
          <div className="lw-rocket">
            <div className="lw-exhaust"><i /><i /><i /><i /><i /><i /></div>
            <Image src={IMAGES.branding.lewtaLogo} alt="" width={1600} height={600} priority />
          </div>
          <div className="lw-clouds"><i /><i /><i /><i /><i /></div>
        </section>
        <section className="lw-side">
          <div className="lw-card">
            <div className="lw-portrait">
              <span className="lw-spark lw-c1" /><span className="lw-spark lw-c2" /><span className="lw-spark lw-c3" /><span className="lw-dash" />
              <Image src={IMAGES.branding.teacherAngelica} alt="Teacher Angélica" width={260} height={260} priority />
            </div>
            <h2>Hi, I’m <em>Teacher Angélica!</em></h2>
            <p>I created LEWTA <em>(Learning English With Teacher Angélica)</em> to help you boost your English through fun games, interactive challenges, and TOEIC practice.</p>
            <p className="lw-small">Get ready to learn, explore, and reach for the stars!</p>
          </div>
          <button className="lw-btn lw-start landing-start" onClick={() => setChoicesOpen(true)}><span className="lw-play" aria-hidden="true">▶</span>CLICK HERE TO START</button>
          <button className="lw-btn lw-comments landing-comments" onClick={() => { setStatus(""); setCommentsOpen(true); }}>LET YOUR COMMENTS HERE</button>
        </section>
      </main>
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
