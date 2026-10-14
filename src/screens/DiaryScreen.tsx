import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

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
  const [selectedEmoji, setSelectedEmoji] = useState('✨');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>INSIGHTS & TRACKING</Text>
          <Text style={styles.title}>Skin Diary</Text>
          <Text style={styles.subtitle}>
            Monitor your skin's daily evolution and consistency.
          </Text>
        </View>

        {/* Streak & Consistency Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakLeft}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>5 Days</Text>
              <Text style={styles.streakLabel}>Current Daily Streak</Text>
            </View>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakBadgeText}>Best: 14</Text>
          </View>
        </View>

        {/* Weekly Consistency Strip */}
        <Text style={styles.sectionHeading}>Weekly Routine Consistency</Text>
        <View style={styles.calendarStrip}>
          {WEEK_DAYS.map(item => {
            const isToday = item.date === '14';
            return (
              <View
                key={item.day}
                style={[styles.dayCard, isToday && styles.dayCardToday]}
              >
                <Text style={[styles.dayText, isToday && styles.dayTextToday]}>
                  {item.day}
                </Text>
                <Text style={[styles.dateText, isToday && styles.dateTextToday]}>
                  {item.date}
                </Text>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.dot,
                      item.am ? styles.dotCompleted : styles.dotEmpty,
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      item.pm ? styles.dotCompleted : styles.dotEmpty,
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Today's Skin Feeling (Emoji Log) */}
        <Text style={styles.sectionHeading}>How does your skin feel today?</Text>
        <View style={styles.emojiGrid}>
          {EMOJI_OPTIONS.map(opt => {
            const isSelected = selectedEmoji === opt.emoji;
            return (
              <TouchableOpacity
                key={opt.label}
                style={[styles.emojiItem, isSelected && styles.emojiItemSelected]}
                onPress={() => setSelectedEmoji(opt.emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiChar}>{opt.emoji}</Text>
                <Text
                  style={[
                    styles.emojiLabel,
                    isSelected && styles.emojiLabelSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Logs Preview */}
        <Text style={styles.sectionHeading}>Recent Notes</Text>
        <View style={styles.logCard}>
          <View style={styles.logHeader}>
            <Text style={styles.logDate}>Yesterday • Evening Log</Text>
            <Text style={styles.logEmoji}>💧 Hydrated</Text>
          </View>
          <Text style={styles.logNote}>
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
    backgroundColor: COLORS.background,
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
    color: COLORS.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  streakCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    color: COLORS.textPrimary,
  },
  streakLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  streakBadge: {
    backgroundColor: '#F7EFE4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accent,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  dayCardToday: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  dayText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  dayTextToday: {
    color: COLORS.primary,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginVertical: 4,
  },
  dateTextToday: {
    color: COLORS.primary,
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
  dotCompleted: {
    backgroundColor: COLORS.secondary,
  },
  dotEmpty: {
    backgroundColor: '#E5E0D8',
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  emojiItem: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  emojiItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  emojiChar: {
    fontSize: 24,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  emojiLabelSelected: {
    color: COLORS.primary,
  },
  logCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    color: COLORS.textSecondary,
  },
  logEmoji: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  logNote: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
  },
});
