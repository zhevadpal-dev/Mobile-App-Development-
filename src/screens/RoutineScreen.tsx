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
  const [activeRoutine, setActiveRoutine] = useState<'AM' | 'PM'>('AM');
  const [amSteps, setAmSteps] = useState<RoutineStep[]>(SAMPLE_AM_STEPS);
  const [pmSteps, setPmSteps] = useState<RoutineStep[]>(SAMPLE_PM_STEPS);

  const steps = activeRoutine === 'AM' ? amSteps : pmSteps;
  const setSteps = activeRoutine === 'AM' ? setAmSteps : setPmSteps;

  const toggleStep = (id: string) => {
    setSteps(prev =>
      prev.map(step => (step.id === id ? { ...step, completed: !step.completed } : step))
    );
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DAILY RITUAL</Text>
          <Text style={styles.title}>Skincare Routine</Text>
          <Text style={styles.subtitle}>
            Sorted thinnest to thickest for optimal absorption.
          </Text>
        </View>

        {/* AM / PM Routine Toggle */}
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeRoutine === 'AM' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveRoutine('AM')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeRoutine === 'AM' && styles.segmentTextActive,
              ]}
            >
              ☀️ Morning Routine
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeRoutine === 'PM' && styles.segmentButtonActive,
            ]}
            onPress={() => setActiveRoutine('PM')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeRoutine === 'PM' && styles.segmentTextActive,
              ]}
            >
              🌙 Evening Routine
            </Text>
          </TouchableOpacity>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {completedCount} of {steps.length} steps completed
            </Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Step-by-Step Checklist */}
        <Text style={styles.sectionHeading}>Steps in Application Order</Text>
        <View style={styles.stepsList}>
          {steps.map(step => (
            <TouchableOpacity
              key={step.id}
              style={[styles.stepItem, step.completed && styles.stepItemCompleted]}
              onPress={() => toggleStep(step.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  step.completed && styles.checkboxCompleted,
                ]}
              >
                {step.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>

              <View style={styles.stepInfo}>
                <View style={styles.stepBadgeRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      Step {step.order} • {step.category}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.stepName,
                    step.completed && styles.stepNameCompleted,
                  ]}
                >
                  {step.name}
                </Text>
                <Text style={styles.stepBrand}>{step.brand}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Finish Routine Action */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            completedCount === steps.length && styles.completeButtonActive,
          ]}
          activeOpacity={0.85}
        >
          <Text style={styles.completeButtonText}>
            {completedCount === steps.length
              ? '✨ Routine Completed! Log Skin'
              : 'Complete All Steps to Log'}
          </Text>
        </TouchableOpacity>
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
    color: COLORS.primary,
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#EFECE6',
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
    backgroundColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentTextActive: {
    color: COLORS.textPrimary,
  },
  progressCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
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
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F0ECE6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  stepsList: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  stepItemCompleted: {
    backgroundColor: '#F9F7F4',
    borderColor: '#EAE6E1',
    opacity: 0.75,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#D4CFC9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  checkboxCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
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
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  stepName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  stepNameCompleted: {
    textDecorationLine: 'line-through',
    color: COLORS.textMuted,
  },
  stepBrand: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  completeButton: {
    backgroundColor: '#E5DFD7',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  completeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  completeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
