import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, RADIUS } from '../constants/theme';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootTabParamList } from '../types/navigation';
import { getCategoryLabel } from './CabinetScreen';

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
  // Interactive UV & Sunscreen recommendation modal visibility
  const [isUvModalVisible, setIsUvModalVisible] = useState<boolean>(false);
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
          <TouchableOpacity
            style={[
              styles.uvTriggerPill,
              {
                backgroundColor: isDark ? '#1C261F' : '#F2F6F3',
                borderColor: isDark ? '#2D3E31' : '#E2EBE4',
              },
            ]}
            onPress={() => setIsUvModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="View weather and UV recommendations"
          >
            <Ionicons name="sunny" size={15} color={colors.accent} />
            <Text style={[styles.uvTriggerText, { color: colors.secondary }]}>
              24°C • UV 6
            </Text>
          </TouchableOpacity>
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
          {t('stepsInOrder')}
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
                      {t('step')} {step.order} • {getCategoryLabel(step.category, t)}
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

      {/* ======================================================== */}
      {/* Interactive Sunscreen Recommendation Modal              */}
      {/* ======================================================== */}
      <Modal
        visible={isUvModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsUvModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconBadge,
                  { backgroundColor: colors.secondaryLight },
                ]}
              >
                <Ionicons name="shield-checkmark" size={16} color={colors.secondary} />
                <Text style={[styles.modalBadgeText, { color: colors.secondary }]}>
                  {t('uvModalTitle')}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsUvModalVisible(false)}
                style={styles.modalCloseIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Weather & UV Summary */}
            <View style={styles.modalBody}>
              <View style={styles.modalWeatherRow}>
                <View
                  style={[
                    styles.weatherIconCircle,
                    { backgroundColor: isDark ? '#35291F' : '#FEF6ED' },
                  ]}
                >
                  <Ionicons name="partly-sunny" size={28} color={colors.accent} />
                </View>
                <View style={styles.weatherInfoTextCol}>
                  <Text style={[styles.modalWeatherText, { color: colors.textPrimary }]}>
                    {t('weatherConditionSunny')}
                  </Text>
                  <View
                    style={[
                      styles.uvLevelChip,
                      { backgroundColor: isDark ? '#3A201A' : '#FCECE8' },
                    ]}
                  >
                    <Ionicons name="warning-outline" size={13} color={colors.primary} />
                    <Text style={[styles.uvLevelChipText, { color: colors.primary }]}>
                      {t('uvIndexHigh')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Smart Sunscreen Recommendation Box */}
              <View
                style={[
                  styles.recommendationCard,
                  {
                    backgroundColor: isDark ? '#232D25' : '#F1F7F3',
                    borderColor: isDark ? '#2F3F33' : '#DBE8DE',
                  },
                ]}
              >
                <View style={styles.recommendationHeaderRow}>
                  <Text style={styles.recommendationEmoji}>🧴</Text>
                  <Text
                    style={[
                      styles.recommendationTitle,
                      { color: colors.textPrimary },
                    ]}
                  >
                    {t('sunscreenRecommendation')}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.recommendationDesc,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t('sunscreenTip')}
                </Text>
              </View>
            </View>

            {/* Modal Bottom CTA */}
            <TouchableOpacity
              style={[
                styles.modalActionButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => setIsUvModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalActionButtonText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  /* Header Layout */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  uvTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  uvTriggerText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  /* Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalIconBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalCloseIconBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  modalBody: {
    marginBottom: SPACING.md,
  },
  modalWeatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: SPACING.md,
  },
  weatherIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherInfoTextCol: {
    flex: 1,
    gap: 4,
  },
  modalWeatherText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  uvLevelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  uvLevelChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recommendationCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
  },
  recommendationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  recommendationEmoji: {
    fontSize: 16,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  recommendationDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalActionButton: {
    height: 46,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
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
