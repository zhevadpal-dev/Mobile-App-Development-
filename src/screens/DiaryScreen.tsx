import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS } from '../constants/theme';
import {
  SkinConditionType,
  SKIN_CONDITIONS,
  DiaryLogEntry,
  SkinConditionOption,
} from '../types/diary';
import {
  getDiaryLogs,
  addDiaryLog,
  deleteDiaryLog,
} from '../services/diaryStorage';

interface CalendarDayItem {
  dateString: string; // 'YYYY-MM-DD'
  dayName: string; // 'Mon', 'Tue', ...
  dayNumber: number; // 1 - 31
  monthName: string; // 'Nov'
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Format date for human-readable display
 */
const formatLogDisplayDate = (dateStr: string): string => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(
    2,
    '0'
  )}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (dateStr === todayStr) {
    return 'Today';
  }
  if (dateStr === yesterdayStr) {
    return 'Yesterday';
  }

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const year = parts[0];
      if (monthIndex >= 0 && monthIndex < 12 && !isNaN(day)) {
        return `${monthNames[monthIndex]} ${day}, ${year}`;
      }
    }
  } catch {
    // fallback
  }
  return dateStr;
};

/**
 * Get current date string in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Generate rolling time-aware days centered on today
 */
const generateRollingDays = (): CalendarDayItem[] => {
  const days: CalendarDayItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 8 past days, today, and 3 future days (total 12 days)
  for (let i = -8; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const dayNumber = d.getDate();
    const isToday = i === 0;
    const isFuture = i > 0;

    days.push({
      dateString,
      dayName,
      dayNumber,
      monthName,
      isToday,
      isFuture,
    });
  }
  return days;
};

export default function DiaryScreen() {
  const { colors, isDark } = useTheme();
  const calendarScrollRef = useRef<any>(null);

  // Today string
  const todayString = useMemo(() => getTodayDateString(), []);

  // Time-aware calendar days
  const calendarDays = useMemo(() => generateRollingDays(), []);

  // Selected date on calendar (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(todayString);

  // Selected skin state for check-in
  const [selectedConditionKey, setSelectedConditionKey] = useState<SkinConditionType>('hydrated');
  const [note, setNote] = useState<string>('');
  const [logs, setLogs] = useState<DiaryLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Active condition details for the check-in section
  const activeCondition: SkinConditionOption =
    SKIN_CONDITIONS.find(c => c.key === selectedConditionKey) || SKIN_CONDITIONS[0];

  // Group logs by date string
  const logsByDate = useMemo(() => {
    const map: Record<string, DiaryLogEntry[]> = {};
    logs.forEach(log => {
      if (!map[log.date]) {
        map[log.date] = [];
      }
      map[log.date].push(log);
    });
    return map;
  }, [logs]);

  // Selected day's log (if any)
  const selectedDayLogs = logsByDate[selectedDate] || [];
  const selectedDayPrimaryLog: DiaryLogEntry | undefined = selectedDayLogs[0];

  /**
   * Load history from AsyncStorage
   */
  const loadLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDiaryLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load diary logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  /**
   * Automatically center calendar strip on Today on mount
   */
  useEffect(() => {
    const todayIndex = calendarDays.findIndex(d => d.isToday);
    if (todayIndex !== -1 && calendarScrollRef.current) {
      const cardWidth = 56;
      const offset = Math.max(0, todayIndex * cardWidth - 110);
      const timer = setTimeout(() => {
        calendarScrollRef.current?.scrollTo?.({ x: offset, animated: true });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [calendarDays]);

  /**
   * Save Skin Log for selected date
   */
  const handleSaveLog = async () => {
    try {
      setIsSaving(true);
      const date = selectedDate || todayString;

      await addDiaryLog({
        date,
        condition: activeCondition.key,
        emoji: activeCondition.emoji,
        label: activeCondition.label,
        tipTitle: activeCondition.tipTitle,
        tipDescription: activeCondition.tipDescription,
        note: note.trim() || undefined,
      });

      setNote('');
      await loadLogs();
      Alert.alert(
        'Skin Logged ✨',
        `Recorded as ${activeCondition.label} for ${formatLogDisplayDate(date)}.`
      );
    } catch (error) {
      console.error('Error saving skin log:', error);
      Alert.alert('Save Error', 'Could not save your log. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Delete Log Entry
   */
  const handleDeleteLog = (id: string, label: string, date: string) => {
    Alert.alert(
      'Remove Entry',
      `Delete ${label} entry from ${formatLogDisplayDate(date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiaryLog(id);
              await loadLogs();
            } catch (error) {
              console.error('Delete error:', error);
            }
          },
        },
      ]
    );
  };

  // Header month text from currently selected date
  const selectedMonthText = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    } catch {}
    return 'November 2026';
  }, [selectedDate]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Skin Diary</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Track your skin history, discover tailored tips, and build consistent habits.
            </Text>
          </View>

          {/* Time-Aware Calendar Section */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeaderRow}>
              <View style={styles.calendarTitleGroup}>
                <Text style={[styles.calendarMonthText, { color: colors.textPrimary }]}>
                  {selectedMonthText}
                </Text>
                <Text style={[styles.calendarSubText, { color: colors.textSecondary }]}>
                  Selected: {formatLogDisplayDate(selectedDate)}
                </Text>
              </View>

              {selectedDate !== todayString && (
                <TouchableOpacity
                  onPress={() => setSelectedDate(todayString)}
                  style={[
                    styles.todayShortcutButton,
                    {
                      backgroundColor: isDark ? '#2A2622' : '#F4EEE7',
                      borderColor: isDark ? '#3D3630' : '#E6DED5',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.todayShortcutText, { color: colors.primary }]}>
                    Jump to Today
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Rolling Weekly Strip */}
            <ScrollView
              ref={calendarScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarStripContent}
            >
              {calendarDays.map(item => {
                const isSelected = selectedDate === item.dateString;
                const dayLogs = logsByDate[item.dateString];
                const hasLog = Boolean(dayLogs && dayLogs.length > 0);
                const loggedEmoji = dayLogs?.[0]?.emoji;

                return (
                  <TouchableOpacity
                    key={item.dateString}
                    style={[
                      styles.dayColumn,
                      {
                        backgroundColor: isSelected
                          ? isDark ? '#38251E' : colors.primaryLight
                          : isDark ? '#1C1B19' : colors.card,
                        borderColor: isSelected
                          ? colors.primary
                          : item.isToday
                          ? colors.secondary
                          : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedDate(item.dateString)}
                    activeOpacity={0.75}
                  >
                    {/* Day Name (Mon, Tue) */}
                    <Text
                      style={[
                        styles.dayNameText,
                        {
                          color: isSelected
                            ? colors.primary
                            : item.isToday
                            ? colors.secondary
                            : colors.textMuted,
                          fontWeight: item.isToday || isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {item.dayName}
                    </Text>

                    {/* Day Number (4, 5) */}
                    <Text
                      style={[
                        styles.dayNumberText,
                        {
                          color: isSelected
                            ? colors.primary
                            : colors.textPrimary,
                          fontWeight: isSelected || item.isToday ? '700' : '500',
                        },
                      ]}
                    >
                      {item.dayNumber}
                    </Text>

                    {/* Indicator Area (Logged Emoji or Subtle Dot) */}
                    <View style={styles.indicatorContainer}>
                      {hasLog ? (
                        <Text style={styles.loggedEmojiIndicator}>{loggedEmoji}</Text>
                      ) : item.isToday ? (
                        <View
                          style={[
                            styles.todayDot,
                            { backgroundColor: colors.secondary },
                          ]}
                        />
                      ) : (
                        <View style={styles.emptyIndicatorDot} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Interactive Date Insight Card (When Tapped) */}
          {selectedDayPrimaryLog ? (
            <View
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isDark ? '#3D2F28' : '#EFEAE3',
                },
              ]}
            >
              <View style={styles.insightHeaderRow}>
                <View style={styles.insightConditionRow}>
                  <Text style={styles.insightEmoji}>{selectedDayPrimaryLog.emoji}</Text>
                  <View>
                    <Text style={[styles.insightConditionTitle, { color: colors.textPrimary }]}>
                      {selectedDayPrimaryLog.label}
                    </Text>
                    <Text style={[styles.insightDateText, { color: colors.textMuted }]}>
                      {formatLogDisplayDate(selectedDayPrimaryLog.date)}{' '}
                      {selectedDayPrimaryLog.time ? `• ${selectedDayPrimaryLog.time}` : ''}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    handleDeleteLog(
                      selectedDayPrimaryLog.id,
                      selectedDayPrimaryLog.label,
                      selectedDayPrimaryLog.date
                    )
                  }
                  style={styles.insightDeleteButton}
                  activeOpacity={0.6}
                  accessibilityLabel="Delete entry"
                >
                  <Text style={[styles.insightDeleteText, { color: colors.textMuted }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Saved Smart Tip */}
              <View
                style={[
                  styles.insightTipContainer,
                  {
                    backgroundColor: isDark ? '#23211F' : '#FAF8F5',
                    borderColor: isDark ? '#33302B' : '#EFECE6',
                  },
                ]}
              >
                <Text style={[styles.insightTipHeading, { color: colors.primary }]}>
                  💡 {selectedDayPrimaryLog.tipTitle}
                </Text>
                <Text style={[styles.insightTipBody, { color: colors.textSecondary }]}>
                  {selectedDayPrimaryLog.tipDescription}
                </Text>
              </View>

              {/* Saved Note if present */}
              {selectedDayPrimaryLog.note ? (
                <Text style={[styles.insightNoteText, { color: colors.textPrimary }]}>
                  "{selectedDayPrimaryLog.note}"
                </Text>
              ) : null}
            </View>
          ) : (
            <View
              style={[
                styles.emptyDayNotice,
                {
                  backgroundColor: isDark ? '#1C1B19' : colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.emptyDayNoticeText, { color: colors.textSecondary }]}>
                {selectedDate === todayString
                  ? 'No skin entry logged yet for today. Select how your skin feels below to record it.'
                  : `No skin entry recorded for ${formatLogDisplayDate(selectedDate)}.`}
              </Text>
            </View>
          )}

          {/* Daily Skin Check-In Section */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginTop: SPACING.md }]}>
            How does your skin feel {selectedDate === todayString ? 'today' : `on ${formatLogDisplayDate(selectedDate)}`}?
          </Text>

          {/* Minimal Emoji Buttons */}
          <View style={styles.emojiGrid}>
            {SKIN_CONDITIONS.map(item => {
              const isSelected = selectedConditionKey === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.emojiCard,
                    {
                      backgroundColor: isSelected
                        ? isDark ? '#38251E' : colors.primaryLight
                        : colors.card,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedConditionKey(item.key)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.emojiChar}>{item.emoji}</Text>
                  <Text
                    style={[
                      styles.emojiLabel,
                      {
                        color: isSelected ? colors.primary : colors.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Dynamic Smart Tip Card */}
          <View
            style={[
              styles.tipCard,
              {
                backgroundColor: isDark ? '#1C1B19' : colors.card,
                borderColor: isDark ? '#3D2F28' : '#F0E5DF',
              },
            ]}
          >
            <View style={styles.tipHeaderRow}>
              <View
                style={[
                  styles.tipBadge,
                  { backgroundColor: isDark ? '#38251E' : colors.primaryLight },
                ]}
              >
                <Text style={[styles.tipBadgeText, { color: colors.primary }]}>
                  💡 Smart Skincare Tip
                </Text>
              </View>
              <Text style={styles.tipConditionEmoji}>{activeCondition.emoji}</Text>
            </View>

            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>
              {activeCondition.tipTitle}
            </Text>

            <Text style={[styles.tipDescription, { color: colors.textSecondary }]}>
              {activeCondition.tipDescription}
            </Text>

            <View
              style={[
                styles.actionBadgeRow,
                {
                  backgroundColor: isDark ? '#262421' : '#F6F3EE',
                  borderColor: isDark ? '#3A3631' : '#EAE4DC',
                },
              ]}
            >
              <Text style={[styles.actionBadgeText, { color: colors.secondary }]}>
                ✓ Suggestion: {activeCondition.recommendedAction}
              </Text>
            </View>
          </View>

          {/* Quick Note Input & Save Button */}
          <View style={styles.noteInputContainer}>
            <TextInput
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Optional note (e.g. hydration mask, travel, reaction)..."
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={120}
            />

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveLog}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>
                  Save Log for {formatLogDisplayDate(selectedDate)}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Historical Logs List */}
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
              All Recorded History
            </Text>
            <Text style={[styles.historyCount, { color: colors.textSecondary }]}>
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : logs.length === 0 ? (
            <View
              style={[
                styles.emptyHistoryCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={styles.emptyHistoryIcon}>📝</Text>
              <Text style={[styles.emptyHistoryTitle, { color: colors.textPrimary }]}>
                No Skin Logs Yet
              </Text>
              <Text style={[styles.emptyHistorySubtitle, { color: colors.textSecondary }]}>
                Tap any emoji above to start tracking your daily skin evolution.
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {logs.map(entry => (
                <View
                  key={entry.id}
                  style={[
                    styles.historyItemCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={styles.historyTopRow}>
                    <View style={styles.historyConditionGroup}>
                      <Text style={styles.historyEmoji}>{entry.emoji}</Text>
                      <View>
                        <Text style={[styles.historyLabel, { color: colors.textPrimary }]}>
                          {entry.label}
                        </Text>
                        <Text style={[styles.historyDate, { color: colors.textMuted }]}>
                          {formatLogDisplayDate(entry.date)} {entry.time ? `• ${entry.time}` : ''}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteLog(entry.id, entry.label, entry.date)}
                      style={styles.deleteIconButton}
                      activeOpacity={0.6}
                      accessibilityLabel="Delete entry"
                    >
                      <Text style={[styles.deleteIconText, { color: colors.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Saved Tip Summary */}
                  <View
                    style={[
                      styles.historyTipBox,
                      {
                        backgroundColor: isDark ? '#23211F' : '#FAF8F5',
                        borderColor: isDark ? '#33302B' : '#EFEAE3',
                      },
                    ]}
                  >
                    <Text style={[styles.historyTipTitle, { color: colors.primary }]}>
                      💡 {entry.tipTitle}
                    </Text>
                    <Text style={[styles.historyTipText, { color: colors.textSecondary }]}>
                      {entry.tipDescription}
                    </Text>
                  </View>

                  {/* Optional user note */}
                  {entry.note ? (
                    <Text style={[styles.historyUserNote, { color: colors.textPrimary }]}>
                      "{entry.note}"
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl * 1.5,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  calendarSection: {
    marginBottom: SPACING.md,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calendarTitleGroup: {
    gap: 2,
  },
  calendarMonthText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  calendarSubText: {
    fontSize: 11,
  },
  todayShortcutButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  todayShortcutText: {
    fontSize: 11,
    fontWeight: '600',
  },
  calendarStripContent: {
    gap: 8,
    paddingVertical: 4,
  },
  dayColumn: {
    width: 50,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  dayNameText: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dayNumberText: {
    fontSize: 16,
    marginBottom: 4,
  },
  indicatorContainer: {
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loggedEmojiIndicator: {
    fontSize: 13,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  emptyIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0,
  },
  insightCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightConditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  insightEmoji: {
    fontSize: 26,
  },
  insightConditionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  insightDateText: {
    fontSize: 11,
    marginTop: 1,
  },
  insightDeleteButton: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightDeleteText: {
    fontSize: 13,
    fontWeight: '600',
  },
  insightTipContainer: {
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  insightTipHeading: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  insightTipBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  insightNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
  emptyDayNotice: {
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  emptyDayNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    fontStyle: 'italic',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  emojiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  emojiCard: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  emojiChar: {
    fontSize: 24,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 11,
  },
  tipCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  tipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  tipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tipConditionEmoji: {
    fontSize: 20,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  actionBadgeRow: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  actionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noteInputContainer: {
    marginBottom: SPACING.lg,
  },
  noteInput: {
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  saveButton: {
    height: 46,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C86D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyHistoryCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyHistoryIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyHistoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  historyList: {
    gap: 10,
  },
  historyItemCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyConditionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyEmoji: {
    fontSize: 26,
  },
  historyLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    marginTop: 1,
  },
  deleteIconButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  historyTipBox: {
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 4,
  },
  historyTipTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 3,
  },
  historyTipText: {
    fontSize: 12,
    lineHeight: 16,
  },
  historyUserNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 16,
  },
});
