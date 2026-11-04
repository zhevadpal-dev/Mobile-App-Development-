import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS } from '../constants/theme';

const EMOJI_OPTIONS = [
  { emoji: '✨', label: 'Glowing' },
  { emoji: '💧', label: 'Hydrated' },
  { emoji: '⚖️', label: 'Balanced' },
  { emoji: '🌵', label: 'Dry' },
  { emoji: '🍓', label: 'Sensitive' },
  { emoji: '⚡', label: 'Breakouts' },
];

const WEEK_DAYS = [
  { day: 'Mon', date: '12', am: true, pm: true },
  { day: 'Tue', date: '13', am: true, pm: true },
  { day: 'Wed', date: '14', am: true, pm: false },
  { day: 'Thu', date: '15', am: false, pm: false },
  { day: 'Fri', date: '16', am: false, pm: false },
  { day: 'Sat', date: '17', am: false, pm: false },
  { day: 'Sun', date: '18', am: false, pm: false },
];

export default function DiaryScreen() {
  const { colors, isDark } = useTheme();
  const [selectedEmoji, setSelectedEmoji] = useState('✨');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>INSIGHTS & TRACKING</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Skin Diary</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Monitor your skin's daily evolution and consistency.
          </Text>
        </View>

        {/* Streak & Consistency Card */}
        <View
          style={[
            styles.streakCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={[styles.streakNumber, { color: colors.textPrimary }]}>5 Days</Text>
              <Text style={[styles.streakLabel, { color: colors.textSecondary }]}>
                Current Daily Streak
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.streakBadge,
              { backgroundColor: isDark ? '#382D20' : '#F7EFE4' },
            ]}
          >
            <Text style={[styles.streakBadgeText, { color: colors.accent }]}>Best: 14</Text>
          </View>
        </View>

        {/* Weekly Consistency Strip */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          Weekly Routine Consistency
        </Text>
        <View style={styles.calendarStrip}>
          {WEEK_DAYS.map(item => {
            const isToday = item.date === '14';
            return (
              <View
                key={item.day}
                style={[
                  styles.dayCard,
                  {
                    backgroundColor: isToday
                      ? isDark ? '#3D251E' : colors.primaryLight
                      : colors.card,
                    borderColor: isToday ? colors.primary : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    { color: isToday ? colors.primary : colors.textMuted },
                  ]}
                >
                  {item.day}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    { color: isToday ? colors.primary : colors.textPrimary },
                  ]}
                >
                  {item.date}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: item.am
                          ? colors.secondary
                          : isDark ? '#3A3733' : '#E5E0D8',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: item.pm
                          ? colors.secondary
                          : isDark ? '#3A3733' : '#E5E0D8',
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Today's Skin Feeling (Emoji Log) */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          How does your skin feel today?
        </Text>
        <View style={styles.emojiGrid}>
          {EMOJI_OPTIONS.map(opt => {
            const isSelected = selectedEmoji === opt.emoji;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[
                  styles.emojiItem,
                  {
                    backgroundColor: isSelected
                      ? isDark ? '#3D251E' : colors.primaryLight
                      : colors.card,
                    borderColor: isSelected ? colors.primary : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedEmoji(opt.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiChar}>{opt.emoji}</Text>
                <Text
                  style={[
                    styles.emojiLabel,
                    { color: isSelected ? colors.primary : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Notes Preview */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          Recent Notes
        </Text>
        <View
          style={[
            styles.logCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.logHeader}>
            <Text style={[styles.logDate, { color: colors.textSecondary }]}>
              Yesterday • Evening Log
            </Text>
            <Text style={[styles.logEmoji, { color: colors.textPrimary }]}>
              💧 Hydrated
            </Text>
          </View>
          <Text style={[styles.logNote, { color: colors.textPrimary }]}>
            Skin barrier feels soothed after applying the ceramide barrier cream. No redness or sensitivity detected.
          </Text>
        </View>
      </ScrollView>
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
    paddingBottom: SPACING.xl,
  },
  header: {
    marginBottom: SPACING.md,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginVertical: SPACING.md,
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  streakLabel: {
    fontSize: 12,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  calendarStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  dayCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  emojiItem: {
    width: '31%',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  emojiChar: {
    fontSize: 24,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  logCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  logEmoji: {
    fontSize: 12,
    fontWeight: '700',
  },
  logNote: {
    fontSize: 13,
    lineHeight: 18,
  },
});
