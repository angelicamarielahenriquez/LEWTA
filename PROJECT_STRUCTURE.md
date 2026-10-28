# LEWTA project structure — a simple guide

This guide explains where everything lives in LEWTA (Learning English with Teacher Angélica) and how to change it safely. You do not need to be a programmer to follow it.

## The folders

| Folder | What is inside |
|---|---|
| `app/` | The website's entry point. `page.tsx` is the "brain": it keeps the student's progress and runs the games. `layout.tsx` sets the page title and fonts. `globals.css` and `styles/` hold the colors and layout (the V10 space design). `api/` holds the private Teacher Dashboard services. |
| `components/` | The screens students see. `layout/` = header, side menu, phone menu. `screens/` = Welcome, Create Account, Learning Hub, City, Passport, Profile, Words to Revisit, How to Play, Teacher Dashboard. `games/` = the five games. |
| `lib/` | The rules. `gameData.ts` = worlds, missions, rewards, aliens and accessories. `progress.ts` = XP, gems, streaks, unlocking and the automatic repair of old saves. `questions.ts` = how questions and answer options are built. `cloudProgress.ts` = saving to Supabase safely. `assets.ts` = the list of every image and sound. `audio.ts` = music and volume. |
| `data/` | The content. `cityDecks.json` = the 960 vocabulary pairs and sentences (12 worlds × 80). `cities.json` = the 12 destinations. `businessCityQuestions.ts` = the 11 special New York Boss questions. |
| `public/images/` | All of your original artwork, organized: `aliens/`, `accessories/`, `cities/`, `stamps/`, `missions/`, `navigation/`, `games/`, `rewards/`, `backgrounds/`, `branding/`. |
| `public/audio/` | `cities/` (12 city songs), `games/` (Review Rush music), `effects/` (click, correct, incorrect, celebrate, level up, time up). |
| `reference/` | Files for you, NOT shown on the website: your original Excel, the corrected Excel (with change log and validation), and the V10 prototype. |
| `supabase/` | The database setup (`schema.sql`) and two optional extras. |
| `tests/` | Automatic checks for the rules, the questions and the images. |
| `docs/` | Setup guides (Supabase, Google sign-in, Windows quick start). |

## Where to add or change things

**A new world (destination)**
1. Add it to `data/cities.json` and to `playOrder` in `lib/gameData.ts` (the order decides what unlocks next).
2. Add 80 pairs for it in `data/cityDecks.json` (same format as the other worlds).
3. Add its pictures: `public/images/cities/<world-id>.png` and `public/images/stamps/<world-id>.png`.
4. Add its music: `public/audio/cities/<world-id>.mp3`.
5. Add an alien and at least one accessory for it (see below). Then run the tests.

**A new alien** — put the picture in `public/images/aliens/<name>.png` and add one line to `aliens` in `lib/gameData.ts` with the city that unlocks it.

**A new accessory** — put the picture in `public/images/accessories/<name>.png` and add one line to `accessories` in `lib/gameData.ts` (name, picture, gem cost, city). The first paid item of each city is that city's free reward.

**Images and sounds** — to replace a picture, keep the same file name and folder. All file paths are listed in `lib/assets.ts`.

## The vocabulary questions

- They are stored in `data/cityDecks.json`. Each pair has: `a` (the target word), `b` (the synonym the student must find), `spanish`, `example` (the sentence), and `note`.
- Positions 1–10 = Learn & Match, 11–20 = Speed Match, 21–30 = Context Match, 31–40 = Review Rush, 1–80 = Business City Boss.
- The easiest way to read them is the Excel `reference/content/LEWTA_Corrected_Question_Bank_V10.xlsx`.

**How to change a question safely**
1. The sentence must contain the target word (`a`) exactly once, written exactly the same way.
2. The sentence must not contain the answer (`b`) or another form of the target word (that would be a clue).
3. Keep the pair `id` the same — students' saved progress uses it.
4. In positions 21–30 (Context Match), keep answers to one or two words, because students type them.
5. Run the tests (below). They will tell you if something is wrong.

## How to test LEWTA on your computer

Open a terminal (CMD) in the project folder and run:

```
npm.cmd install        (only the first time)
npm.cmd run check      (TypeScript + code quality + all automatic tests)
npm.cmd run build      (the same build Vercel does)
npm.cmd run dev        (opens the site at http://localhost:3000)
```

## How to publish

See `docs/DEPLOY_GUIDE.md`. Short version: put the code on GitHub, let Vercel make a **Preview**, test the preview, and only then promote it to Production.

## Secret information

Passwords and keys live ONLY in `.env.local` on your computer and in Vercel's Environment Variables. They are never uploaded to GitHub (the `.gitignore` file blocks them). `.env.example` shows the names without real values.
