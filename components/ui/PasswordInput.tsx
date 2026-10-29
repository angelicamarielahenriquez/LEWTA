"use client";
import { useState, type InputHTMLAttributes } from "react";

/** Password field with an eye button to show / hide what was typed. Always starts hidden. */
export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return <div className="password-field">
    <input {...props} type={visible ? "text" : "password"} />
    <button type="button" className="eye-btn" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"}
      onClick={() => setVisible((v) => !v)}>
      {visible
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /><path d="M3 3l18 18" /></svg>}
    </button>
  </div>;
}
