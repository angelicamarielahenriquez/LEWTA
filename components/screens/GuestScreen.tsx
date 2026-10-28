"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { alienImage } from "@/lib/assets";

/** Guest entry, in the same V10 card style as Create Account. */
export function GuestScreen() {
  const { startAsGuest, guestFormError, go } = useLewta();
  return <div className="form-page">
    <form className="auth" onSubmit={startAsGuest}>
      <Image src={alienImage("nova")} alt="" width={110} height={110} />
      <h1>Continue as a Guest</h1>
      <p>Enter your name so your teacher can recognize your activity on this device.</p>
      <label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" required placeholder="Your first name" />
      <label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" required placeholder="Your last name" />
      {guestFormError && <p className="auth-error" role="alert">{guestFormError}</p>}
      <button className="btn">CONTINUE AS A GUEST 🚀</button>
      <button type="button" className="btn ghost back" onClick={() => go("welcome")}>← Back to Welcome</button>
      <p>Guest progress is saved only in this browser.</p>
    </form>
  </div>;
}
