/**
 * Every image and sound used by LEWTA, in one place.
 * Files live in /public. To change a picture, replace the file with the same name
 * (or change the path here). See PROJECT_STRUCTURE.md for details.
 */

export const IMAGES = {
  branding: {
    lewtaLogo: "/images/branding/lewta-logo.png",
    businessCityLogo: "/images/branding/business-city-logo.png",
    teacherAngelica: "/images/branding/teacher-angelica.png",
  },
  backgrounds: {
    landingScreen: "/images/backgrounds/landing-screen.png",
    reviewRush: "/images/backgrounds/review-rush.png",
    stars: "/images/backgrounds/stars.png",
    planets: [1, 2, 3, 4, 5, 6].map((n) => `/images/backgrounds/planet-${n}.png`),
  },
  games: {
    cityOfSynonyms: "/images/games/city-of-synonyms.png",
    grammarQuest: "/images/games/grammar-quest.png",
    readingLab: "/images/games/reading-lab.png",
    hint: "/images/games/hint.png",
  },
  navigation: {
    learn: "/images/navigation/learn.png",
    profile: "/images/navigation/profile.png",
    passport: "/images/navigation/city-progress.png",
    wordsToRevisit: "/images/navigation/words-to-revisit.png",
    howToPlay: "/images/navigation/how-to-play.png",
    teacherDashboard: "/images/navigation/teacher-dashboard.png",
    exit: "/images/navigation/exit.png",
    nextDestination: "/images/navigation/next-destination-airplane.png",
  },
  rewards: {
    xp: "/images/rewards/xp-icon.png",
    gems: "/images/rewards/gems-icon.png",
    streak: "/images/rewards/streak-icon.png",
    cityReward: "/images/rewards/city-reward.png",
    revisitTarget: "/images/rewards/words-to-revisit-target.png",
  },
} as const;

export const cityIcon = (cityId: string) => `/images/cities/${cityId}.png`;
export const cityStamp = (cityId: string) => `/images/stamps/${cityId}.png`;
export const alienImage = (alienId: string) => `/images/aliens/${alienId}.png`;
export const accessoryImage = (file: string) => `/images/accessories/${file}.png`;

export type MissionState = "continue" | "completed" | "locked";
const MISSION_SLUGS = ["learn-match", "speed-match", "context-match", "review-rush", "business-city-boss"] as const;
export const missionImage = (roundIndex: number, state: MissionState) =>
  `/images/missions/${MISSION_SLUGS[roundIndex] ?? MISSION_SLUGS[0]}-${state}.png`;

export const AUDIO = {
  /** The welcome-screen theme (same song as New York, as in the V10 prototype). */
  lewtaTheme: "/audio/cities/new-york.mp3",
  reviewRush: "/audio/games/review-rush.mp3",
  effects: {
    click: "/audio/effects/click.mp3",
    correct: "/audio/effects/correct.mp3",
    incorrect: "/audio/effects/incorrect.mp3",
    celebrate: "/audio/effects/celebrate.mp3",
    levelUp: "/audio/effects/level-up.mp3",
    timeUp: "/audio/effects/time-up.mp3",
  },
} as const;
export const cityMusic = (cityId: string) => `/audio/cities/${cityId}.mp3`;
