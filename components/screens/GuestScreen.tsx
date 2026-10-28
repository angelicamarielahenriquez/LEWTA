"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { alienImage } from "@/lib/assets";

export function GuestScreen() {
  const { startAsGuest, guestFormError, go } = useLewta();
  return <div className="form-page">
    <form className="auth" onSubmit={startAsGuest}>
      <Image src={alienImage("nova")} alt="" width={110} height={110} />
      <h1>Start as a <em>Guest</em></h1>
      <p>Enter your name so your teacher can recognize your activity on this device.</p>
      <div className="form-grid">
        <label>First name<input name="firstName" autoComplete="given-name" placeholder="Your first name" required /></label>
        <label>Last name<input name="lastName" autoComplete="family-name" placeholder="Your last name" required /></label>
      </div>
      {guestFormError && <div className="error-box" role="alert">{guestFormError}</div>}
      <div className="note"><b>Guest mode:</b> your progress stays in this browser. It is not shared with other devices.</div>
      <button className="btn full">CONTINUE AS A GUEST 🚀</button>
      <button type="button" className="btn ghost full" onClick={() => go("welcome")}>← Back to Welcome</button>
    </form>
  </div>;
}
