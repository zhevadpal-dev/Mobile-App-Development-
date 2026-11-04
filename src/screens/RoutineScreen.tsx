import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, RADIUS } from '../constants/theme';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootTabParamList } from '../types/navigation';

/**
 * Determine default routine tab based on device's current local time:
 * - 05:00 (5:00 AM) to 16:59 (4:59 PM) -> 'AM' (Morning Routine)
 * - 17:00 (5:00 PM) or later, or before 05:00 AM -> 'PM' (Evening Routine)
 */
const getDefaultRoutineByTime = (): 'AM' | 'PM' => {
  const currentHour = new Date().getHours();
  return currentHour >= 5 && currentHour < 17 ? 'AM' : 'PM';
};

interface RoutineStep {
  id: string;
  order: number;
  category: string;
  name: string;
  brand: string;
  completed: boolean;
}

const SAMPLE_AM_STEPS: RoutineStep[] = [
  { id: '1', order: 1, category: 'Cleanser', name: 'Gentle Foaming Cleanser', brand: 'CeraVe', completed: true },
  { id: '2', order: 2, category: 'Toner', name: 'Hydrating Rose Mist', brand: 'Fresh', completed: true },
  { id: '3', order: 3, category: 'Serum', name: '10% Niacinamide + Zinc', brand: 'The Ordinary', completed: true },
  { id: '4', order: 4, category: 'Moisturizer', name: 'Daily Barrier Cream', brand: 'La Roche-Posay', completed: false },
  { id: '5', order: 5, category: 'Sunscreen', name: 'Anthelios UV Fluid SPF 50+', brand: 'La Roche-Posay', completed: false },
];

const SAMPLE_PM_STEPS: RoutineStep[] = [
  { id: '1', order: 1, category: 'Cleanser', name: 'Soothing Micellar Cleanser', brand: 'Bioderma', completed: false },
  { id: '2', order: 2, category: 'Toner', name: 'BHA Exfoliating Liquid', brand: "Paula's Choice", completed: false },
  { id: '3', order: 3, category: 'Serum', name: 'Hyaluronic Acid 2% + B5', brand: 'The Ordinary', completed: false },
  { id: '4', order: 4, category: 'Moisturizer', name: 'Overnight Barrier Cream', brand: 'CeraVe', completed: false },
  { id: '5', order: 5, category: 'Facial Oil', name: '100% Organic Rosehip Oil', brand: 'The Ordinary', completed: false },
];

export default function RoutineScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();
  // Set default routine tab based on device's current local time
  const [activeRoutine, setActiveRoutine] = useState<'AM' | 'PM'>(getDefaultRoutineByTime);
  const [amSteps, setAmSteps] = useState<RoutineStep[]>(SAMPLE_AM_STEPS);
  const [pmSteps, setPmSteps] = useState<RoutineStep[]>(SAMPLE_PM_STEPS);

  // Re-check local time when screen mounts
  useEffect(() => {
    setActiveRoutine(getDefaultRoutineByTime());
  }, []);

  const steps = activeRoutine === 'AM' ? amSteps : pmSteps;
  const setSteps = activeRoutine === 'AM' ? setAmSteps : setPmSteps;

  const toggleStep = (id: string) => {
    setSteps(prev =>
      prev.map(step => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  const handleCompleteRoutine = () => {
    if (completedCount === steps.length) {
      navigation.navigate('Diary');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('routineTitle')}</Text>
        </View>

        {/* AM / PM Routine Toggle */}
        <View
          style={[
            styles.segmentedControl,
            { backgroundColor: isDark ? '#23211F' : '#EFECE6' },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeRoutine === 'AM' && [
                styles.segmentButtonActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => setActiveRoutine('AM')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeRoutine === 'AM'
                      ? colors.textPrimary
                      : colors.textSecondary,
                  fontWeight: activeRoutine === 'AM' ? '700' : '600',
                },
              ]}
            >
              ☀️ {t('morningRoutine')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeRoutine === 'PM' && [
                styles.segmentButtonActive,
                { backgroundColor: colors.card },
              ],
            ]}
            onPress={() => setActiveRoutine('PM')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                {
                  color:
                    activeRoutine === 'PM'
                      ? colors.textPrimary
                      : colors.textSecondary,
                  fontWeight: activeRoutine === 'PM' ? '700' : '600',
                },
              ]}
            >
              🌙 {t('eveningRoutine')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View
          style={[
            styles.progressCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
              {completedCount} / {steps.length} {t('stepsCompleted')}
            </Text>
            <Text style={[styles.progressPercent, { color: colors.primary }]}>
              {progressPercent}%
            </Text>
          </View>
          <View
            style={[
              styles.progressBarTrack,
              { backgroundColor: isDark ? '#2E2B27' : '#F0ECE6' },
            ]}
          >
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercent}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
        </View>

        {/* Step-by-Step Checklist */}
        <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
          Steps in Application Order
        </Text>
        <View style={styles.stepsList}>
          {steps.map(step => (
            <TouchableOpacity
              key={step.id}
              style={[
                styles.stepItem,
                {
                  backgroundColor: step.completed
                    ? isDark ? '#1C1B19' : '#F9F7F4'
                    : colors.card,
                  borderColor: step.completed
                    ? isDark ? '#2A2825' : '#EAE6E1'
                    : colors.cardBorder,
                  opacity: step.completed ? 0.8 : 1,
                },
              ]}
              onPress={() => toggleStep(step.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: step.completed
                      ? colors.primary
                      : isDark ? '#48443F' : '#D4CFC9',
                    backgroundColor: step.completed ? colors.primary : 'transparent',
                  },
                ]}
              >
                {step.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.stepInfo}>
                <View style={styles.stepBadgeRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: isDark ? '#3D251E' : colors.primaryLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryBadgeText,
                        { color: colors.primary },
                      ]}
                    >
                      Step {step.order} • {step.category}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.stepName,
                    {
                      color: step.completed
                        ? colors.textMuted
                        : colors.textPrimary,
                      textDecorationLine: step.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {step.name}
                </Text>
                <Text
                  style={[
                    styles.stepBrand,
                    { color: colors.textSecondary },
                  ]}
                >
                  {step.brand}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Finish Routine Action */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            {
              backgroundColor:
                completedCount === steps.length
                  ? colors.primary
                  : isDark ? '#282623' : '#E5DFD7',
            },
          ]}
          onPress={handleCompleteRoutine}
          disabled={completedCount !== steps.length}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.completeButtonText,
              {
                color:
                  completedCount === steps.length
                    ? '#FFFFFF'
                    : isDark ? '#7A7571' : '#8A857F',
              },
            ]}
          >
            {completedCount === steps.length
              ? `✨ ${t('routineCompletedBtn')}`
              : `${completedCount}/${steps.length} ${t('stepsCompleted')}`}
          </Text>
        </TouchableOpacity>
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
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 4,
    marginVertical: SPACING.md,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADIUS.full,
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
  },
  progressCard: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  stepsList: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepInfo: {
    flex: 1,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepName: {
    fontSize: 15,
    fontWeight: '600',
  },
  stepBrand: {
    fontSize: 12,
    marginTop: 1,
  },
  completeButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
