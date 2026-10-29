"use client";
/**
 * Shared state and actions for every LEWTA screen.
 * app/page.tsx creates this value; screens read it with useLewta().
 */
import { createContext, useContext } from "react";
import type { Alien, Accessory } from "@/lib/gameData";
import type { AudioSettings } from "@/lib/audio";
import type { TeacherRow } from "@/lib/teacher";
import type { VisitorComment } from "@/lib/comments";
import type { SavedGame } from "@/lib/savedGame";
import type { City, GameResult, GameState, Page, Pair, Player, Progress } from "@/types/lewta";

export type ReviewMode = "flashcards" | "multiple" | "typing";

export type LewtaApi = {
  // state
  page: Page;
  player: Player | null;
  progress: Progress;
  busy: boolean;
  authError: string;
  authMessage: string;
  guestFormError: string;
  activeCity: City;
  activeDeck: Pair[];
  roundDone: number[];
  selectedAlien: Alien;
  equipped: Accessory;
  game: GameState | null;
  gameResult: GameResult | null;
  timeLeft: number;
  paused: boolean;
  audio: AudioSettings;
  teacherPreviewMode: boolean;
  teacherAuthorized: boolean;
  teacherAccessConfigured: boolean;
  teacherAuthError: string;
  teacherRows: TeacherRow[];
  teacherComments: VisitorComment[];
  // navigation
  go: (page: Page) => void;
  navigate: (dest: "learn" | "profile" | "passport" | "revisit" | "how" | "teacher" | "exit") => void;
  showNotice: (message: string) => void;
  clearAuthMessages: () => void;
  // accounts
  register: (e: React.FormEvent<HTMLFormElement>) => void;
  login: (e: React.FormEvent<HTMLFormElement>) => void;
  loginWithGoogle: () => void;
  startAsGuest: (e: React.FormEvent<HTMLFormElement>) => void;
  logout: () => void;
  // world and missions
  enterCity: (cityId: string) => void;
  openCityOfSynonyms: () => void;
  startGame: (roundIndex: number) => void;
  leaveGame: () => void;
  togglePause: () => void;
  chooseMatchLeft: (pairId: number) => void;
  chooseMatchRight: (pairId: number) => void;
  setGameInput: (value: string) => void;
  submitAnswer: (value: string) => void;
  nextQuestion: () => void;
  /** Review Rush: click/tap a falling meteor. */
  hitMeteor: (id: string) => void;
  // words to revisit
  markMastered: (cityId: string, id: number) => void;
  addMiss: (cityId: string, ids: number[]) => void;
  // profile
  selectAlien: (id: string) => void;
  equipAccessory: (id: string) => void;
  buyAccessory: (id: string) => void;
  saveBio: (text: string) => void;
  resetProgress: () => void;
  // audio
  setAudio: (next: Partial<AudioSettings>) => void;
  playEffect: (name: "click" | "correct" | "incorrect" | "celebrate" | "levelUp" | "timeUp", level?: number) => void;
  /** "" = no music, "lewta" = LEWTA theme, "review" = Review Rush, or a city id. */
  musicTrack: string;
  chooseTrack: (track: string) => void;
  toggleMusic: () => void;
  // teacher
  openTeacherDashboard: () => void;
  teacherLogin: (password: string) => void;
  teacherLogout: () => void;
  reloadTeacherRows: () => void;
  startTeacherTest: (cityId: string) => void;
  exitTeacherTest: () => void;
  // Review Rush speed and "continue where you left off"
  setRushSpeed: (speed: number) => void;
  savedGame: SavedGame | null;
  resumeSavedGame: () => void;
  discardSavedGame: () => void;
};

export const LewtaContext = createContext<LewtaApi | null>(null);

export function useLewta(): LewtaApi {
  const value = useContext(LewtaContext);
  if (!value) throw new Error("useLewta must be used inside LewtaContext.Provider");
  return value;
}
