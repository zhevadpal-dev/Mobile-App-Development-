import AsyncStorage from '@react-native-async-storage/async-storage';
import { MilestoneDefinition, MilestoneId, UserMilestonesData, Affirmation } from '../types/milestone';

export const MILESTONES_STORAGE_KEY = '@skin_diary_milestones_data_v1';

export const MILESTONE_DEFINITIONS: MilestoneDefinition[] = [
  {
    id: 'first_ritual',
    icon: '🌱',
    titleKey: 'milestoneFirstRitualTitle',
    descKey: 'milestoneFirstRitualDesc',
    hintKey: 'milestoneFirstRitualHint',
  },
  {
    id: 'streak_3',
    icon: '✨',
    titleKey: 'milestoneStreak3Title',
    descKey: 'milestoneStreak3Desc',
    hintKey: 'milestoneStreak3Hint',
  },
  {
    id: 'streak_7',
    icon: '🌿',
    titleKey: 'milestoneStreak7Title',
    descKey: 'milestoneStreak7Desc',
    hintKey: 'milestoneStreak7Hint',
  },
  {
    id: 'streak_14',
    icon: '👑',
    titleKey: 'milestoneStreak14Title',
    descKey: 'milestoneStreak14Desc',
    hintKey: 'milestoneStreak14Hint',
  },
  {
    id: 'cabinet_5',
    icon: '🧴',
    titleKey: 'milestoneCabinet5Title',
    descKey: 'milestoneCabinet5Desc',
    hintKey: 'milestoneCabinet5Hint',
  },
  {
    id: 'mask_ritual',
    icon: '🧖‍♀️',
    titleKey: 'milestoneMaskRitualTitle',
    descKey: 'milestoneMaskRitualDesc',
    hintKey: 'milestoneMaskRitualHint',
  },
];

export const MORNING_AFFIRMATIONS: Affirmation[] = [
  {
    id: 'am_1',
    en: 'Your skin is prepped and glowing—have a radiant day!',
    tr: 'Cildin hazır ve ışıldıyor; günün aydın ve parlak geçsin!',
  },
  {
    id: 'am_2',
    en: 'A gentle morning ritual sets the tone for everything ahead.',
    tr: 'Nazik bir sabah ritüeli, günün tüm güzelliklerine zemin hazırlar.',
  },
  {
    id: 'am_3',
    en: 'Protected, hydrated, and ready to shine.',
    tr: 'Korundu, nemlendi ve ışıldamaya hazır.',
  },
  {
    id: 'am_4',
    en: 'Every morning is a fresh start for your skin and spirit.',
    tr: 'Her sabah, cildin ve ruhun için yepyeni bir başlangıçtır.',
  },
  {
    id: 'am_5',
    en: 'Nourish your skin today; let your inner light lead the way.',
    tr: 'Bugün cildini besle, içindeki ışıltı sana yol göstersin.',
  },
  {
    id: 'am_6',
    en: 'Mindful skincare, peaceful heart, glowing presence.',
    tr: 'Bilinçli bakım, dingin bir kalp ve ışıl ışıl bir duruş.',
  },
];

export const EVENING_AFFIRMATIONS: Affirmation[] = [
  {
    id: 'pm_1',
    en: 'You washed the day away. Rest well and let your skin repair.',
    tr: 'Günün yorgunluğunu geride bıraktın. Huzurla dinlen, cildin yenilensin.',
  },
  {
    id: 'pm_2',
    en: 'Consistency is the purest form of self-love. Sweet dreams!',
    tr: 'Süreklilik, kendine gösterebileceğin en saf sevgidir. Tatlı rüyalar!',
  },
  {
    id: 'pm_3',
    en: 'Your evening ritual is complete—time to unwind.',
    tr: 'Akşam ritüelin tamamlandı; şimdi gevşeme ve dinlenme zamanı.',
  },
  {
    id: 'pm_4',
    en: 'Let your skin breathe and recover under the quiet night sky.',
    tr: 'Gecenin sessizliğinde cildin nefes alsın ve tazelensin.',
  },
  {
    id: 'pm_5',
    en: 'A mindful touch at night brings calm to your soul and skin.',
    tr: 'Gece yapılan özenli bir dokunuş, hem cildine hem ruhuna dinginlik verir.',
  },
  {
    id: 'pm_6',
    en: 'Tomorrow begins with tonight’s restful care. Sleep deeply.',
    tr: 'Yarının ışıltısı bu gecenin dinlendirici bakımında saklı. İyi uykular.',
  },
];

export const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateKey = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getPreviousDayKey = (key: string): string => {
  const d = parseDateKey(key);
  d.setDate(d.getDate() - 1);
  return formatDateKey(d);
};

/**
 * Calculate current consecutive streak and longest streak from date array (YYYY-MM-DD)
 */
export const calculateStreak = (
  dates: string[],
  todayKey: string = getTodayKey()
): { currentStreak: number; longestStreak: number } => {
  if (!dates || dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const dateSet = new Set(dates);
  const yesterdayKey = getPreviousDayKey(todayKey);

  // Determine starting point for current streak
  let currentStreak = 0;
  let cursor: string | null = null;

  if (dateSet.has(todayKey)) {
    cursor = todayKey;
  } else if (dateSet.has(yesterdayKey)) {
    cursor = yesterdayKey;
  }

  if (cursor) {
    while (cursor && dateSet.has(cursor)) {
      currentStreak++;
      cursor = getPreviousDayKey(cursor);
    }
  }

  // Calculate longest streak across all recorded dates
  const sortedDates = Array.from(dateSet).sort();
  let longestStreak = 0;

  for (const date of sortedDates) {
    let run = 0;
    let check: string | null = date;
    while (check && dateSet.has(check)) {
      run++;
      check = getPreviousDayKey(check);
    }
    if (run > longestStreak) {
      longestStreak = run;
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
  };
};

/**
 * Load user milestones and streak data from AsyncStorage
 */
export const getMilestonesData = async (): Promise<UserMilestonesData> => {
  try {
    const raw = await AsyncStorage.getItem(MILESTONES_STORAGE_KEY);
    if (!raw) {
      return {
        completedDates: [],
        currentStreak: 0,
        longestStreak: 0,
        unlockedMilestones: {},
        lastAffirmationDate: {},
      };
    }
    const data: UserMilestonesData = JSON.parse(raw);
    const { currentStreak, longestStreak } = calculateStreak(data.completedDates || []);
    return {
      completedDates: data.completedDates || [],
      currentStreak,
      longestStreak: Math.max(longestStreak, data.longestStreak || 0),
      unlockedMilestones: data.unlockedMilestones || {},
      lastRoutineCompletedAt: data.lastRoutineCompletedAt,
      lastAffirmationDate: data.lastAffirmationDate || {},
    };
  } catch (error) {
    console.error('Failed to read milestones data:', error);
    return {
      completedDates: [],
      currentStreak: 0,
      longestStreak: 0,
      unlockedMilestones: {},
      lastAffirmationDate: {},
    };
  }
};

/**
 * Save user milestones data to AsyncStorage
 */
export const saveMilestonesData = async (data: UserMilestonesData): Promise<void> => {
  try {
    await AsyncStorage.setItem(MILESTONES_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save milestones data:', error);
  }
};

/**
 * Check whether affirmation modal can be shown today for the given routine
 */
export const canShowAffirmationToday = async (
  routineType: 'AM' | 'PM',
  todayKey: string = getTodayKey()
): Promise<boolean> => {
  const data = await getMilestonesData();
  const routineKey = routineType === 'AM' ? 'morning' : 'evening';
  const lastDate = data.lastAffirmationDate?.[routineKey];
  return lastDate !== todayKey;
};

/**
 * Record that affirmation modal was shown today for the given routine
 */
export const recordAffirmationShownToday = async (
  routineType: 'AM' | 'PM',
  todayKey: string = getTodayKey()
): Promise<void> => {
  const data = await getMilestonesData();
  const routineKey = routineType === 'AM' ? 'morning' : 'evening';
  const updatedData: UserMilestonesData = {
    ...data,
    lastAffirmationDate: {
      ...data.lastAffirmationDate,
      [routineKey]: todayKey,
    },
  };
  await saveMilestonesData(updatedData);
};

/**
 * Select a random affirmation quote
 */
export const getRandomAffirmation = (
  routineType: 'AM' | 'PM',
  language: 'en' | 'tr' = 'en'
): string => {
  const pool = routineType === 'AM' ? MORNING_AFFIRMATIONS : EVENING_AFFIRMATIONS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  const item = pool[randomIndex] || pool[0];
  return language === 'tr' ? item.tr : item.en;
};

/**
 * Record a completed routine (AM or PM) for today, update streak, and evaluate milestones
 */
export const recordRoutineCompletion = async (
  routineType: 'AM' | 'PM',
  isMaskCompleted: boolean = false
): Promise<{
  newlyUnlocked: MilestoneDefinition[];
  currentStreak: number;
  longestStreak: number;
  shouldShowAffirmation: boolean;
}> => {
  const data = await getMilestonesData();
  const today = getTodayKey();
  const routineKey = routineType === 'AM' ? 'morning' : 'evening';
  const alreadyShownToday = data.lastAffirmationDate?.[routineKey] === today;

  const dateSet = new Set(data.completedDates);
  dateSet.add(today);

  const updatedDates = Array.from(dateSet).sort();
  const { currentStreak, longestStreak } = calculateStreak(updatedDates, today);

  const newlyUnlocked: MilestoneDefinition[] = [];
  const updatedUnlocked = { ...data.unlockedMilestones };
  const nowIso = new Date().toISOString();

  // Strict one-time unlock check:
  // If the milestone already exists in data.unlockedMilestones or updatedUnlocked, never unlock or notify again
  const tryUnlock = (id: MilestoneId) => {
    if (data.unlockedMilestones?.[id] || updatedUnlocked[id]) {
      return;
    }
    updatedUnlocked[id] = nowIso;
    const def = MILESTONE_DEFINITIONS.find(m => m.id === id);
    if (def) {
      newlyUnlocked.push(def);
    }
  };

  // 1. First Ritual
  if (updatedDates.length >= 1) {
    tryUnlock('first_ritual');
  }

  // 2. Streaks
  if (currentStreak >= 3) {
    tryUnlock('streak_3');
  }
  if (currentStreak >= 7) {
    tryUnlock('streak_7');
  }
  if (currentStreak >= 14) {
    tryUnlock('streak_14');
  }

  // 3. Mask Ritual
  if (isMaskCompleted) {
    tryUnlock('mask_ritual');
  }

  const updatedData: UserMilestonesData = {
    completedDates: updatedDates,
    currentStreak,
    longestStreak: Math.max(longestStreak, data.longestStreak),
    unlockedMilestones: updatedUnlocked,
    lastRoutineCompletedAt: nowIso,
    lastAffirmationDate: {
      ...data.lastAffirmationDate,
      [routineKey]: today,
    },
  };

  await saveMilestonesData(updatedData);

  return {
    newlyUnlocked,
    currentStreak,
    longestStreak: updatedData.longestStreak,
    shouldShowAffirmation: !alreadyShownToday,
  };
};

/**
 * Record single completed mask step and unlock mask_ritual if not yet unlocked
 */
export const recordMaskStepCompletion = async (): Promise<MilestoneDefinition[]> => {
  const data = await getMilestonesData();
  if (data.unlockedMilestones && data.unlockedMilestones['mask_ritual']) return [];

  const nowIso = new Date().toISOString();
  const updatedUnlocked = { ...data.unlockedMilestones, mask_ritual: nowIso };
  const updatedData: UserMilestonesData = {
    ...data,
    unlockedMilestones: updatedUnlocked,
  };
  await saveMilestonesData(updatedData);
  const def = MILESTONE_DEFINITIONS.find(m => m.id === 'mask_ritual');
  return def ? [def] : [];
};

/**
 * Evaluate cabinet product count milestones (e.g. 5+ products)
 */
export const checkCabinetMilestones = async (
  productCount: number
): Promise<MilestoneDefinition[]> => {
  if (productCount < 5) return [];

  const data = await getMilestonesData();
  if (data.unlockedMilestones && data.unlockedMilestones['cabinet_5']) return [];

  const nowIso = new Date().toISOString();
  const updatedUnlocked = { ...data.unlockedMilestones, cabinet_5: nowIso };

  const updatedData: UserMilestonesData = {
    ...data,
    unlockedMilestones: updatedUnlocked,
  };

  await saveMilestonesData(updatedData);

  const def = MILESTONE_DEFINITIONS.find(m => m.id === 'cabinet_5');
  return def ? [def] : [];
};
