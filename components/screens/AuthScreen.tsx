"use client";
import Image from "next/image";
import { useLewta } from "@/components/LewtaContext";
import { alienImage } from "@/lib/assets";
import { promotions } from "@/lib/gameData";
import { isSupabaseConfigured } from "@/lib/supabase";

/** V10 Create Account / Sign In card, connected to Supabase (email and Google). */
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
      {sign && <>
        <label htmlFor="firstName">First name</label><input id="firstName" name="firstName" autoComplete="given-name" required placeholder="Your first name" />
        <label htmlFor="lastName">Last name</label><input id="lastName" name="lastName" autoComplete="family-name" required placeholder="Your last name" />
        <label htmlFor="username">Username</label><input id="username" name="username" autoComplete="username" required minLength={3} placeholder="Choose a username" />
        <label htmlFor="promotion">Promotion</label>
        <select id="promotion" name="promotion" defaultValue="2026" className="auth-select">{promotions.map((p) => <option key={p} value={p}>{p === "Other" ? "Other / not listed" : p}</option>)}</select>
      </>}
      <label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" required placeholder="student@example.com" />
      <label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={sign ? "new-password" : "current-password"} required minLength={sign ? 8 : 1} placeholder="Password" />
      {sign && <><label htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} placeholder="Type your password again" /></>}
      {authError && <p className="auth-error" role="alert">{authError}</p>}
      {authMessage && <p className="auth-ok" role="status">{authMessage}</p>}
      {sign && <p className="confirm-note">📧 After you create your account, open the confirmation email and click the link. Then <b>come back to this page</b> and sign in with your email and password.</p>}
      <button className="btn" disabled={busy || !isSupabaseConfigured}>{busy ? "PLEASE WAIT…" : sign ? "CREATE ACCOUNT" : "SIGN IN"} 🚀</button>
      <button type="button" className="btn ghost back" onClick={() => go("welcome")}>← Back to Welcome</button>
      <p>{sign ? <>Already registered? <button type="button" className="link-btn" onClick={() => go("login")}>Sign in</button></> : <>New to LEWTA? <button type="button" className="link-btn" onClick={() => go("register")}>Create an account</button></>}</p>
    </form>
  </div>;
}
