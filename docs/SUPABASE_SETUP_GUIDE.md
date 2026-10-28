# LEWTA + Supabase setup guide

LEWTA now supports two separate entry paths:

- **Create Account / Log In:** Supabase Auth (email + password) and progress stored in the Supabase database.
- **Continue as Guest:** no login required. Guest profile, game progress, and activity stay in the current browser on that device and the guest gameplay path never uploads that data. When Supabase is configured, the app can check for a previously signed-in account on startup, but guest play does not depend on those credentials.

Account registration is intentionally disabled until the public project URL and publishable key are provided. Guest mode does not depend on either variable and remains usable when Supabase is unconfigured or unavailable.

## 1. Create the Supabase database tables

1. Open your Supabase project.
2. Open **SQL Editor** and create a new query.
3. Open `supabase/schema.sql` from this project, copy the entire file into the SQL Editor, and run it.
4. The schema creates `profiles`, `player_progress`, and `student_sessions`, an account-profile trigger, and row-level security (RLS) policies. It also backfills existing Supabase Auth users into `profiles`.
5. Verify the three tables exist in **Table Editor**.

Run the SQL in the same Supabase project that will be used by LEWTA. Do not disable RLS on these tables.

## 2. Copy the public Supabase settings

In Supabase, locate your project's **Project URL** and **Publishable key** (older projects may show an `anon` key).

1. Copy `.env.example` to `.env.local` in the `LEWTA_Platform` project root.
2. Set these two values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_public_key
```

Use the exact URL and publishable/anon key from your project. A publishable/anon key is intended to be used in browser applications; row-level security policies protect the data. Never put a Supabase secret or service-role key in a `NEXT_PUBLIC_` variable.

## 3. Test locally

From a terminal opened in the `LEWTA_Platform` folder, run:

```bat
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

1. **Continue as Guest** should work whether or not Supabase is configured. Guest progress stays on that browser/device.
2. **Create Account** requests first name, last name, username, promotion, email, and password.
3. If email confirmation is enabled in Supabase, the student must click the confirmation email before logging in. The app displays a reminder. If auto-confirm is enabled, signup may create a session immediately.
4. Log out and log back in with the email and password to check that progress comes back from `player_progress`.

In Supabase **Authentication → URL Configuration**, make sure the Site URL and Redirect URLs permit both local testing and the published site. Suggested URLs are `http://localhost:3000/**` and `https://lewtaplatformlocal.vercel.app/**`. Use your actual production domain if different.

## 4. Configure Vercel

In Vercel, open the existing LEWTA project → **Settings → Environment Variables**. Add the following for Production (and Preview/Development if you use those environments):

- `NEXT_PUBLIC_SUPABASE_URL` — Project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (or use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for an older key, which this app also accepts).
- `TEACHER_EMAILS` — the e-mail address of the teacher's LEWTA account (several can be separated by commas). Only a signed-in account with this **verified** e-mail gets Teacher Mode and the Teacher Dashboard. Alternatively set `role = 'teacher'` on that account's row in `profiles` (students cannot change this column).
- `SUPABASE_SECRET_KEY` — server-only key used to check the teacher and read class data. Never prefix it with `NEXT_PUBLIC_`.
- `TEACHER_DASHBOARD_PASSWORD` / `TEACHER_DASHBOARD_SECRET` are no longer used (the shared password was replaced by the teacher account) and can be deleted.
- `SUPABASE_SECRET_KEY` — **server-only** Supabase secret key. For older projects you can use `SUPABASE_SERVICE_ROLE_KEY` instead.

`SUPABASE_SECRET_KEY` is used only by the password-protected `/api/teacher-data` server route so the teacher dashboard can retrieve all authenticated students' progress. It must not have the `NEXT_PUBLIC_` prefix and must never be copied into frontend code, client-side environment variables, or shared screenshots. If you do not set it, account authentication and cloud progress may work, but the teacher dashboard can only show records available locally.

After saving environment variables, redeploy the project. Next.js public environment variables are embedded when the app is built, so adding them without a new deployment will not activate the account buttons on the live page.

## 5. What gets saved where?

| Feature | Supabase configured | Supabase not configured |
|---|---|---|
| Create Account / Log In | Enabled; email/password managed by Supabase Auth | Disabled with setup guidance |
| Progress, XP, gems, streak, unlocks | Saved to `player_progress` for the account | Existing guest/legacy local data stays in browser storage |
| Student session summaries | Saved to `student_sessions` for authenticated accounts | Local browser only |
| Continue as Guest | Always available; guest data remains local | Always available; no credentials needed |
| Guest progress/session logs | Local browser/device only | Local browser/device only |
| Teacher cross-device account report | Requires teacher password settings and server-only Supabase secret key | Not available; local records only |

Guest data intentionally does not upload to Supabase. This guarantees that a guest can continue playing even if Supabase is not configured, but guest progress and guest records do not synchronize across devices.

## 6. Security notes

- Auth passwords are handled by Supabase Auth; LEWTA no longer stores a locally computed password hash for new account signups.
- The browser receives only the Supabase publishable/anon key.
- RLS policies limit profile, progress, and session access to the signed-in user.
- The teacher data endpoint checks the existing server-side teacher password session before using the server-only Supabase secret key.
- Do not share the contents of `.env.local`; it is git-ignored.

## Troubleshooting

- **Account button says Supabase setup pending:** one or both public environment variables are missing or the site has not been redeployed since adding them.
- **Sign-up works but profile/progress tables are missing:** run the complete `supabase/schema.sql` in the correct Supabase project.
- **Confirmation email never arrives:** review Supabase Authentication email settings, confirmations, SMTP configuration, and redirect URL configuration.
- **Progress does not sync:** check the browser console, Vercel deployment logs, the project's Supabase URL/key, and that the SQL schema has been applied.
- **Teacher dashboard lists only local guest sessions:** set `SUPABASE_SECRET_KEY` server-side and make sure teacher password configuration is valid, then redeploy.

## 7. Turn on "Continue with Google" (optional)

The Google button is already built into LEWTA. It works as soon as Google is switched on in Supabase. Until then, students see a friendly message and can use email.

1. **Google Cloud Console** (https://console.cloud.google.com) → create a project (for example "LEWTA") → **APIs & Services → OAuth consent screen**: choose *External*, app name "LEWTA", your email, and save.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Web application**.
   - *Authorized redirect URI*: copy it from Supabase → **Authentication → Sign In / Providers → Google** (it looks like `https://ktwpnbyplskyrpwknire.supabase.co/auth/v1/callback`).
3. Copy the **Client ID** and **Client secret** that Google shows you.
4. In Supabase → **Authentication → Sign In / Providers → Google** → turn it on, paste the Client ID and Client secret → Save.
5. In Supabase → **Authentication → URL Configuration**, make sure your site addresses are allowed, for example `https://lewtaplatformlocal.vercel.app/**` and `http://localhost:3000/**`.

Never paste the Google client secret into the LEWTA code or into GitHub. It only goes into Supabase.

## 8. Optional extras (NOT applied automatically)

- `supabase/optional_visitor_comments.sql` — lets the welcome-screen comments reach your Teacher Dashboard from any device. Adds one new table only.
- `supabase/optional_security_fixes.sql` — a fix suggested by the Supabase security advisor. Changes no tables or data.

Run them only if you want them: Supabase → **SQL Editor** → paste the file → **Run**.

## 9. How progress is protected (V10)

- Every save first reads the account's progress in Supabase and **adds** this device's new achievements to it. An old phone or tablet can no longer erase newer progress.
- When a student logs in, progress saved on that device and in the cloud is combined. Nothing earned is lost.
- Aliens, destinations and city rewards that a student's completed missions prove they earned are restored automatically, with **no extra XP or gems**.
- For accounts, the profile button "Reload from my account" only refreshes the device; it never deletes cloud progress. Only guests can reset their (local) progress.
- No tables or security rules were changed for V10. `supabase/schema.sql` is the same as before.
