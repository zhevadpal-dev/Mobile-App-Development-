export type SkinConditionType = 'glowing' | 'hydrated' | 'dry' | 'sensitive' | 'breakout';

export interface SkinConditionOption {
  key: SkinConditionType;
  emoji: string;
  label: string;
  tipTitle: string;
  tipDescription: string;
  recommendedAction: string;
}

export const SKIN_CONDITIONS: SkinConditionOption[] = [
  {
    key: 'glowing',
    emoji: '✨',
    label: 'Glowing',
    tipTitle: 'Radiance Protection',
    tipDescription: 'Your skin barrier is thriving! Lock in that hydration with a nourishing moisturizer and keep your broad-spectrum SPF high throughout the day.',
    recommendedAction: 'Maintain your current routine and don’t forget sunscreen.',
  },
  {
    key: 'hydrated',
    emoji: '💧',
    label: 'Hydrated',
    tipTitle: 'Balanced Moisture',
    tipDescription: 'Plump and smooth skin indicates optimal water retention. Avoid over-stripping your barrier and stick to mild, balanced formulations.',
    recommendedAction: 'Keep up daily hydration layers.',
  },
  {
    key: 'dry',
    emoji: '🌵',
    label: 'Dry',
    tipTitle: 'Deep Hydration Rescue',
    tipDescription: 'Your skin barrier lacks lipids and moisture. Consider applying an overnight hydrating mask tonight and layer with a rich ceramide cream or nourishing facial oil.',
    recommendedAction: 'Use an intensive hydrating mask tonight.',
  },
  {
    key: 'sensitive',
    emoji: '🌸',
    label: 'Sensitive',
    tipTitle: 'Barrier Recovery Mode',
    tipDescription: 'Your skin is reactive today. Skip strong active acids (AHA/BHA), retinoids, and exfoliating scrubs. Focus strictly on soothing centella asiatica, panthenol, and ceramides.',
    recommendedAction: 'Pause active ingredients & use soothing recovery balm.',
  },
  {
    key: 'breakout',
    emoji: '🩹',
    label: 'Breakout',
    tipTitle: 'Targeted Blemish Care',
    tipDescription: 'Treat active inflammation gently. Apply a targeted 2% salicylic acid or tea tree spot treatment. Avoid picking, keep pillowcases clean, and use non-comedogenic moisturizers.',
    recommendedAction: 'Gentle spot treatment & non-comedogenic hydration.',
  },
];

export interface DiaryLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: number;
  condition: SkinConditionType;
  emoji: string;
  label: string;
  tipTitle: string;
  tipDescription: string;
  note?: string;
}

export type CreateDiaryLogInput = Omit<DiaryLogEntry, 'id' | 'timestamp' | 'time'> & {
  id?: string;
  time?: string;
  timestamp?: number;
};
