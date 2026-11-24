import { TranslationKey } from '../constants/translations';

export type MilestoneId =
  | 'first_ritual'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'cabinet_5'
  | 'mask_ritual';

export interface MilestoneDefinition {
  id: MilestoneId;
  icon: string;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  hintKey: TranslationKey;
}

export interface UserMilestonesData {
  completedDates: string[];
  currentStreak: number;
  longestStreak: number;
  unlockedMilestones: Record<string, string>; // milestoneId -> unlockedAt (ISO string or YYYY-MM-DD)
  lastRoutineCompletedAt?: string;
  lastAffirmationDate?: {
    morning?: string;
    evening?: string;
  };
}

export interface Affirmation {
  id: string;
  en: string;
  tr: string;
}
