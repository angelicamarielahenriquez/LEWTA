# LEWTA — Learning English with Teacher Angélica

A space-themed English-learning platform built with Next.js, React, TypeScript, and Supabase-ready persistence. It supports two separate access paths: cloud accounts for students who register with Supabase, and **Continue as Guest** for students who want to play without an account or Supabase connection.

## What is included

- Welcome screen with Create Account, Log In, and Continue as Guest.
- Twelve destinations: New York, Panama City, London, Tokyo, Paris, Mexico, Dubai, Singapore, Dublin, Jamaica, Andalusia, and Rio de Janeiro.
- 80 synonym pairs per destination (960 total), Spanish meanings, example sentences, categories, and context notes.
- Five missions per city: Learn & Match, Speed Match, Context Match, Review Rush, and Business City Boss.
- XP, gems, streaks, unlockable destinations, passport, aliens, and accessories.
- Words to Revisit, progress summaries, student session tracking, and a Teacher Dashboard.
- Original supplied logos, navigation art, city aliens, mission state images, sound effects, and city music.
- Poppins for main headings, Inter for body text, and Nunito for selected friendly UI details.

## Two modes: Supabase Account vs Guest

### Supabase Account

When `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are configured and `supabase/schema.sql` has been run, Create Account and Log In use Supabase Auth with email/password. Profile metadata is stored in `profiles`, progress/rewards are stored in `player_progress`, and account activity summaries are written to `student_sessions`. RLS policies limit account data access to the signed-in student. Progress can be restored on another device after the student logs in.

New signups ask for first name, last name, username, promotion, email, and password. If email confirmation is enabled in Supabase, the student must click the confirmation email before logging in.

### Continue as Guest

Continue as Guest remains available if Supabase is not configured or is unavailable. The guest gameplay/session path uses `localStorage` only and never reads or writes guest progress to the cloud. If Supabase is configured, the app may check whether a returning user has an active account session at startup; choosing Guest itself does not require an account. A guest enters first and last name and can start immediately. Guest progress and session activity stay on the current browser/device and do not sync to another device or the class database.

If Supabase public settings are missing, the account registration/login buttons are disabled with setup guidance rather than creating insecure browser-only passwords. Existing legacy local sessions can still be resumed in local-only mode when Supabase is not configured.

## Supabase setup

Follow **`SUPABASE_SETUP_GUIDE.md`**. In short:

1. Run the full `supabase/schema.sql` in your Supabase SQL Editor.
2. Copy `.env.example` to `.env.local` and enter `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Test locally using `npm.cmd install` and `npm.cmd run dev`.
4. Add the public settings to Vercel and redeploy to enable account mode on the live site.
5. For cloud student data in the Teacher Dashboard, configure `TEACHER_DASHBOARD_PASSWORD`, `TEACHER_DASHBOARD_SECRET`, and a **server-only** `SUPABASE_SECRET_KEY` in Vercel. Never prefix a secret key with `NEXT_PUBLIC_`.

The Supabase secret is only used by `/api/teacher-data`, which first requires the existing server-verified teacher password session. The secret is never bundled into browser JavaScript. If the teacher secret is not configured, student account auth/progress can work, but the teacher report can only show local guest records.

## Run on Windows

1. Extract the ZIP.
2. Open the `LEWTA_Platform` folder.
3. Follow `SUPABASE_SETUP_GUIDE.md` if you want cloud accounts. Guest mode does not require these steps.
4. Double-click `start-dev.bat`, or open CMD in this folder and run:

```bat
npm.cmd install
npm.cmd run dev
```

5. Open `http://localhost:3000`.

To stop the local server, press `Ctrl+C` in the terminal.

## Publish updates

Run this from the already-linked `LEWTA_Platform` folder:

```bat
npx.cmd vercel --prod
```

This redeploys the current project; do not create another Vercel project. Changes to `NEXT_PUBLIC_` environment variables require a new build/deployment before they reach the live site.

## Main files

- `app/page.tsx` — site navigation, guest flow, Supabase registration/login, progression/game logic, local and cloud progress handling, and teacher dashboard UI.
- `lib/supabase.ts` — public browser client; gracefully disabled if public Supabase settings are absent.
- `supabase/schema.sql` — profiles, progress, sessions, auth trigger, and RLS policies.
- `app/api/teacher-auth/route.ts` — server-side teacher password verification and signed HttpOnly session cookie.
- `app/api/teacher-data/route.ts` — teacher-cookie-protected cloud report; server-only Supabase secret key stays on the server.
- `SUPABASE_SETUP_GUIDE.md` — full setup, Vercel configuration, and troubleshooting instructions.
- `.env.example` — placeholder environment variable names only; never put real keys here.
- `data/cityDecks.json` — all 960 synonym pairs.
- `data/businessCityQuestions.ts` — curated New York Business City Boss questions.
- `public/images/` and `public/audio/` — supplied visual and audio assets.

## Validation notes

The Supabase integration and SQL migration are included, but **the live connection has not yet been tested against your actual Supabase project** because its Project URL and keys have not been provided in this conversation. The code includes checks that explain when the schema is missing; guest mode should remain usable without Supabase configured. Run the SQL and local build/test steps in `SUPABASE_SETUP_GUIDE.md` before replacing the live production deployment.
