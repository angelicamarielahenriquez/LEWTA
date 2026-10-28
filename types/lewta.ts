/** Shared LEWTA data types. */

export type Pair = {
  id: number;
  deckId: string;
  category: string;
  /** The target word or phrase shown in the sentence. */
  a: string;
  /** The synonym the student must find. */
  b: string;
  spanish: string;
  example: string;
  note: string;
  /** New York Business City Boss curated questions only. */
  businessQuestion?: boolean;
  choices?: string[];
};

export type City = { id: string; name: string; country: string; emoji: string; art: string; description: string };

export type GameMode = "match" | "speed" | "context" | "review" | "boss";

export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  promotion: string;
  role?: string;
  guestId?: string;
  sessionId?: string;
  email?: string;
  authUserId?: string;
  storageMode?: "supabase" | "guest" | "legacy-local";
};

export type Progress = {
  xp: number;
  gems: number;
  streak: number;
  unlockedCities: string[];
  completedRounds: Record<string, number[]>;
  missedPairIds: Record<string, number[]>;
  masteredPairIds: Record<string, number[]>;
  masteryCounts: Record<string, Record<string, number>>;
  selectedAlien: string;
  unlockedAliens: string[];
  equippedAccessory: string;
  unlockedAccessories: string[];
  lastActiveDay: string;
  /** "About me" text shown on the passport photo card (max 250 characters). */
  bio?: string;
  /** ISO time of the last change; used to merge progress from different devices safely. */
  updatedAt?: string;
};

export type GameOption = { value: string; pairId: number; correct: boolean };

export type GameState = {
  mode: GameMode;
  roundIndex: number;
  pairs: Pair[];
  matched: number[];
  leftCards: Pair[];
  rightCards: Pair[];
  selectedLeft: number | null;
  selectedRight: number | null;
  questionIndex: number;
  options: GameOption[];
  input: string;
  answered: boolean;
  answerCorrect: boolean | null;
  chosenValue: string;
  removed: string[];
  hearts: number;
  mistakes: number;
  correctAnswers: number;
  elapsed: number;
  total: number;
};

export type GameResult = {
  passed: boolean;
  timedOut: boolean;
  correct: number;
  total: number;
  roundIndex: number;
  cityId: string;
  xpEarned: number;
  gemsEarned: number;
  replay: boolean;
  newCityId?: string;
  newAlienId?: string;
  newAccessoryId?: string;
};

export type Page =
  | "welcome" | "register" | "login" | "guest" | "hub" | "city" | "game" | "results"
  | "passport" | "profile" | "revisit" | "how" | "teacher-login" | "teacher";
