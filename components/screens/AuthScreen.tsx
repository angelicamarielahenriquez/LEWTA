"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { alienImage } from "@/lib/assets";
import { promotions } from "@/lib/gameData";
import { isSupabaseConfigured } from "@/lib/supabase";

/** Create Account and Log In (Supabase email/password and Google). */
export function AuthScreen({ kind }: { kind: "register" | "login" }) {
  const { register, login, loginWithGoogle, busy, authError, authMessage, go } = useLewta();
  const sign = kind === "register";
  return <div className="form-page">
    <form className="auth" onSubmit={sign ? register : login}>
      <Image src={alienImage(sign ? "luna" : "ziggy")} alt="" width={110} height={110} />
      <h1>{sign ? "Create Your Account" : "Welcome Back, Explorer!"}</h1>
      <p>{sign ? "Join LEWTA and begin your English adventure." : "Sign in to continue your learning journey."}</p>
      <button type="button" className="google-btn" onClick={loginWithGoogle} disabled={busy || !isSupabaseConfigured}><span className="google-g">G</span> Continue with Google</button>
      <div className="auth-separator">or continue with email</div>
      {sign && <div className="form-grid">
        <label>First name<input name="firstName" autoComplete="given-name" placeholder="Your first name" required /></label>
        <label>Last name<input name="lastName" autoComplete="family-name" placeholder="Your last name" required /></label>
      </div>}
      {sign && <div className="form-grid">
        <label>Username<input name="username" autoComplete="username" placeholder="Choose a username" minLength={3} required /></label>
        <label>Promotion<select name="promotion" defaultValue="2026">{promotions.map((p) => <option key={p} value={p}>{p === "Other" ? "Other / not listed" : p}</option>)}</select></label>
      </div>}
      <label>Email<input name="email" type="email" autoComplete="email" placeholder="student@example.com" required /></label>
      <label>Password<input name="password" type="password" autoComplete={sign ? "new-password" : "current-password"} placeholder={sign ? "At least 8 characters" : "Password"} minLength={sign ? 8 : 1} required /></label>
      {sign && <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Type your password again" minLength={8} required /></label>}
      {authError && <div className="error-box" role="alert">{authError}</div>}
      {authMessage && <div className="success-box" role="status">{authMessage}</div>}
      {!isSupabaseConfigured && <div className="note">Accounts are not connected in this version yet. You can play right now with <b>Continue as Guest</b>.</div>}
      <button className="btn full" disabled={busy || !isSupabaseConfigured}>{busy ? "Please wait…" : sign ? "CREATE ACCOUNT 🚀" : "SIGN IN 🚀"}</button>
      <p className="auth-switch">{sign ? <>Already registered? <button type="button" onClick={() => go("login")}>Log in</button></> : <>New to LEWTA? <button type="button" onClick={() => go("register")}>Create an account</button></>}</p>
      <button type="button" className="btn ghost full" onClick={() => go("welcome")}>← Back to Welcome</button>
    </form>
  </div>;
}
