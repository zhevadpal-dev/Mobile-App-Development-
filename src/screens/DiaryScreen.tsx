import React, { useState, useEffect, useCallback } from 'react';
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

/**
 * Format log date for elegant display
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
 * Get current date string in YYYY-MM-DD
 */
const getCurrentDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DiaryScreen() {
  const { colors, isDark } = useTheme();

  // Selected skin state (default to Hydrated)
  const [selectedConditionKey, setSelectedConditionKey] = useState<SkinConditionType>('hydrated');
  const [note, setNote] = useState<string>('');
  const [logs, setLogs] = useState<DiaryLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Active condition details
  const activeCondition: SkinConditionOption =
    SKIN_CONDITIONS.find(c => c.key === selectedConditionKey) || SKIN_CONDITIONS[0];

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
   * Save Today's Skin Log
   */
  const handleSaveLog = async () => {
    try {
      setIsSaving(true);
      const date = getCurrentDateString();

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
      Alert.alert('Skin Logged ✨', `Recorded as ${activeCondition.label} for ${formatLogDisplayDate(date)}.`);
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
              Log how your skin feels today to receive actionable care tips.
            </Text>
          </View>

          {/* Skin Condition Selector */}
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            How does your skin feel today?
          </Text>

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

          {/* Quick Note Input */}
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
              placeholder="Optional note (e.g. new moisturizer, sun exposure)..."
              placeholderTextColor={colors.textMuted}
              value={note}
              onChangeText={setNote}
              maxLength={120}
            />

            {/* Save Log Button */}
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveLog}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Today's Log</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* History Section */}
          <View style={styles.historyHeaderRow}>
            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>
              History Log
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
                Log how your skin feels to begin tracking your skin changes over time.
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
                      style={styles.deleteButton}
                      activeOpacity={0.6}
                      accessibilityLabel="Delete entry"
                    >
                      <Text style={[styles.deleteButtonText, { color: colors.textMuted }]}>
                        ✕
                      </Text>
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
  deleteButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
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
