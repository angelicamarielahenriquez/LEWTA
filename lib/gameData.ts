/**
 * LEWTA game rules and catalogs: worlds, missions, rewards, aliens and accessories.
 * Reward amounts and unlock rules are the original LEWTA rules.
 */
import citiesSource from "@/data/cities.json";
import decksSource from "@/data/cityDecks.json";
import { newYorkBusinessQuestions } from "@/data/businessCityQuestions";
import type { City, GameMode, Pair } from "@/types/lewta";

export const cities = citiesSource as City[];
export const cityDecks = decksSource as Record<string, Pair[]>;

/** Official destination order: completing all five missions in one city unlocks the next. */
export const playOrder = ["new-york", "panama-city", "london", "tokyo", "paris", "mexico", "dubai", "singapore", "dublin", "jamaica", "andalusia", "rio-de-janeiro"];

export type RoundInfo = { title: string; subtitle: string; mode: GameMode; time: number | null; reward: number; gemReward: number };
export const roundInfo: RoundInfo[] = [
  { title: "Learn & Match", subtitle: "Make your first word connections", mode: "match", time: null, reward: 100, gemReward: 2 },
  { title: "Speed Match", subtitle: "Match before the clock runs out", mode: "speed", time: 60, reward: 150, gemReward: 3 },
  { title: "Context Match", subtitle: "Write a synonym for the target word", mode: "context", time: null, reward: 175, gemReward: 3 },
  { title: "Review Rush", subtitle: "Blast the wrong meteors; keep the best synonym", mode: "review", time: 180, reward: 200, gemReward: 4 },
  { title: "Business City Boss", subtitle: "The final challenge: all 80 city pairs", mode: "boss", time: 480, reward: 500, gemReward: 10 },
];
/** Playing a mission again gives 20% of its XP (at least 10) and no gems. */
export const replayXp = (roundIndex: number) => Math.max(10, Math.round(roundInfo[roundIndex].reward * 0.2));

export type Alien = { id: string; name: string; unlockCity: string; color: string };
export const aliens: Alien[] = [
  { id: "ziggy", name: "Ziggy", unlockCity: "new-york", color: "mint" },
  { id: "luna", name: "Luna", unlockCity: "panama-city", color: "pink" },
  { id: "nova", name: "Nova", unlockCity: "london", color: "lavender" },
  { id: "orbit", name: "Orbit", unlockCity: "tokyo", color: "blue" },
  { id: "pixel", name: "Pixel", unlockCity: "paris", color: "yellow" },
  { id: "comet", name: "Comet", unlockCity: "mexico", color: "pink" },
  { id: "loo", name: "Loo", unlockCity: "dubai", color: "blue" },
  { id: "yue", name: "Yue", unlockCity: "singapore", color: "pink" },
  { id: "bob", name: "Bob", unlockCity: "dublin", color: "mint" },
  { id: "jaxar", name: "Jaxar", unlockCity: "jamaica", color: "lavender" },
  { id: "ben", name: "Ben", unlockCity: "andalusia", color: "yellow" },
  { id: "blue", name: "Blue", unlockCity: "rio-de-janeiro", color: "blue" },
];

/**
 * Accessories. Rule (unchanged): an item can be bought with gems once its city is unlocked,
 * and the first paid item listed for a city is given free when all five missions of that city are completed.
 * Original IDs are kept so items students already own stay owned.
 */
export type Accessory = { id: string; name: string; image: string; cost: number; unlockCity: string };
export const accessories: Accessory[] = [
  { id: "starter-cap", name: "Planet Cap", image: "planet-cap", cost: 0, unlockCity: "new-york" },
  { id: "cool-glasses", name: "Cool Glasses", image: "cool-glasses", cost: 5, unlockCity: "new-york" },
  { id: "explorer-pack", name: "Explorer Backpack", image: "backpack", cost: 8, unlockCity: "panama-city" },
  { id: "golden-frog", name: "Panamanian Golden Frog", image: "panamanian-golden-frog", cost: 10, unlockCity: "panama-city" },
  { id: "sancocho", name: "Sancocho Bowl", image: "sancocho", cost: 10, unlockCity: "panama-city" },
  { id: "space-headphones", name: "Purple Headphones", image: "purple-headphones", cost: 10, unlockCity: "london" },
  { id: "winking-face", name: "Winking Face", image: "winking-face", cost: 6, unlockCity: "london" },
  { id: "gold-crown", name: "Golden Crown", image: "golden-crown", cost: 15, unlockCity: "tokyo" },
  { id: "heart-eyes-face", name: "Heart Eyes", image: "heart-eyes-face", cost: 6, unlockCity: "tokyo" },
  { id: "red-scarf", name: "Red Scarf", image: "red-scarf", cost: 12, unlockCity: "paris" },
  { id: "paris-beret", name: "Paris Beret", image: "paris-beret", cost: 12, unlockCity: "paris" },
  { id: "mexico-pin", name: "Mexican Hat", image: "mexican-hat", cost: 12, unlockCity: "mexico" },
  { id: "moustache", name: "Moustache", image: "moustache", cost: 8, unlockCity: "mexico" },
  { id: "neon-visor", name: "Money Bag", image: "money-bag", cost: 18, unlockCity: "dubai" },
  { id: "angry-face", name: "Angry Face", image: "angry-face", cost: 6, unlockCity: "dubai" },
  { id: "orchid-pin", name: "Orchid Flower", image: "orchid-flower", cost: 14, unlockCity: "singapore" },
  { id: "spiral-eyes-face", name: "Spiral Eyes", image: "spiral-eyes-face", cost: 6, unlockCity: "singapore" },
  { id: "clover-charm", name: "Clover Charm", image: "clover-charm", cost: 10, unlockCity: "dublin" },
  { id: "flirty-face", name: "Flirty Face", image: "flirty-face", cost: 6, unlockCity: "dublin" },
  { id: "island-headphones", name: "Jamaican Maracas", image: "jamaican-maracas", cost: 16, unlockCity: "jamaica" },
  { id: "melting-face", name: "Melting Face", image: "melting-face", cost: 6, unlockCity: "jamaica" },
  { id: "flamenco-flower", name: "Flamenco Shoe", image: "flamenco-shoe", cost: 14, unlockCity: "andalusia" },
  { id: "yawning-face", name: "Yawning Face", image: "yawning-face", cost: 6, unlockCity: "andalusia" },
  { id: "magic-hat", name: "Magic Wand", image: "magic-wand", cost: 20, unlockCity: "rio-de-janeiro" },
  { id: "screaming-face", name: "Screaming Face", image: "screaming-face", cost: 6, unlockCity: "rio-de-janeiro" },
  { id: "nauseated-face", name: "Nauseated Face", image: "nauseated-face", cost: 6, unlockCity: "rio-de-janeiro" },
];
/** The free reward for completing a city: the first paid item listed for that city (original rule). */
export const cityRewardAccessory = (cityId: string) => accessories.find((a) => a.unlockCity === cityId && a.cost > 0);

export const promotions = ["2026", "2027", "2028", "2029", "Other"];

/** New York Boss uses 11 curated Business English questions first. */
export const newYorkBossPairs: Pair[] = newYorkBusinessQuestions.map((q) => ({
  id: q.id,
  deckId: `new-york-business-${q.id}`,
  category: q.category,
  a: q.answer,
  b: q.answer,
  spanish: q.spanish,
  example: q.sentence,
  note: q.explanation,
  businessQuestion: true,
  choices: q.choices,
}));

export const cityById = (id: string) => cities.find((c) => c.id === id);
export const cityName = (id: string) => cityById(id)?.name ?? id;
