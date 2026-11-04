import AsyncStorage from '@react-native-async-storage/async-storage';
import { DiaryLogEntry, CreateDiaryLogInput } from '../types/diary';

const DIARY_STORAGE_KEY = '@skin_diary_logs';

/**
 * Generate a unique diary log ID
 */
const generateLogId = (): string => {
  return 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
};

/**
 * Get current time in HH:mm format
 */
const getFormattedTime = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Fetch all diary logs from AsyncStorage (sorted latest first)
 */
export const getDiaryLogs = async (): Promise<DiaryLogEntry[]> => {
  try {
    const raw = await AsyncStorage.getItem(DIARY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: DiaryLogEntry[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    // Return sorted newest first
    return parsed.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching diary logs from AsyncStorage:', error);
    return [];
  }
};

/**
 * Add a new skin condition log entry to AsyncStorage
 */
export const addDiaryLog = async (input: CreateDiaryLogInput): Promise<DiaryLogEntry> => {
  try {
    const now = Date.now();
    const newEntry: DiaryLogEntry = {
      ...input,
      id: input.id || generateLogId(),
      time: input.time || getFormattedTime(),
      timestamp: input.timestamp || now,
    };

    const currentLogs = await getDiaryLogs();
    // Filter out if user already logged the exact same day/time or prepend
    const updatedLogs = [newEntry, ...currentLogs];

    await AsyncStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(updatedLogs));
    return newEntry;
  } catch (error) {
    console.error('Error saving diary log to AsyncStorage:', error);
    throw error;
  }
};

/**
 * Delete a specific diary log entry from AsyncStorage
 */
export const deleteDiaryLog = async (id: string): Promise<boolean> => {
  try {
    const currentLogs = await getDiaryLogs();
    const filtered = currentLogs.filter(item => item.id !== id);

    if (filtered.length === currentLogs.length) {
      return false;
    }

    await AsyncStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error(`Error deleting diary log with id ${id}:`, error);
    throw error;
  }
};

/**
 * Clear all diary logs from AsyncStorage
 */
export const clearAllDiaryLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DIARY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing diary logs:', error);
    throw error;
  }
};
