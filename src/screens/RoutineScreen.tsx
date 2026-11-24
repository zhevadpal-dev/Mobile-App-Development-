import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, RADIUS } from '../constants/theme';
import { RootTabParamList } from '../types/navigation';
import { Product, RoutineType } from '../types/product';
import { getProducts, updateProduct } from '../services/productStorage';
import { getCategoryLabel, getCategoryMeta } from './CabinetScreen';
import {
  recordRoutineCompletion,
  recordMaskStepCompletion,
  getRandomAffirmation,
} from '../services/milestoneService';
import { MilestoneDefinition } from '../types/milestone';

const ROUTINE_COMPLETION_STORAGE_KEY = '@skin_diary_routine_completed_steps';

/**
 * Determine default routine tab based on device's current local time:
 * - 05:00 (5:00 AM) to 16:59 (4:59 PM) -> 'AM' (Morning Routine)
 * - 17:00 (5:00 PM) or later, or before 05:00 AM -> 'PM' (Evening Routine)
 */
const getDefaultRoutineByTime = (): 'AM' | 'PM' => {
  const currentHour = new Date().getHours();
  return currentHour >= 5 && currentHour < 17 ? 'AM' : 'PM';
};

const getTodayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export interface RoutineStep {
  id: string;
  order: number;
  category: string;
  name: string;
  brand: string;
  completed: boolean;
  orderWeight: number;
  imageUri?: string;
}

/**
 * Check if a product is a mask
 */
export const isMaskProduct = (p: Product): boolean => {
  const cat = (p.category || '').toLowerCase();
  return cat.includes('mask') || cat.includes('treat') || !!p.maskType;
};

/**
 * Filter mask products so they only appear in the active routine when actually due.
 * Checks day of the week for weekendsOnly, and calculates day interval from lastCompletedDate or createdAt.
 */
export const isMaskDue = (
  p: Product,
  targetDate: Date = new Date(),
  todayKey: string = getTodayKey()
): boolean => {
  if (!isMaskProduct(p)) return true;

  // If already completed today, keep visible in today's routine steps as completed
  if (p.lastCompletedDate === todayKey) {
    return true;
  }

  // 1. Check weekend restriction
  if (p.weekendsOnly) {
    const day = targetDate.getDay();
    const isWeekend = day === 0 || day === 6; // Sunday (0) or Saturday (6)
    if (!isWeekend) {
      return false;
    }
  }

  // 2. Frequency day interval
  const frequency = p.frequency || 'weekly';
  let intervalDays = 7;
  if (frequency === 'every_3_days') intervalDays = 3;
  else if (frequency === 'weekly') intervalDays = 7;
  else if (frequency === 'every_2_weeks') intervalDays = 14;
  else if (frequency === 'every_3_weeks') intervalDays = 21;

  // 3. Day interval calculation
  if (p.lastCompletedDate) {
    const lastDate = new Date(p.lastCompletedDate);
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    const elapsedDays = Math.round((targetMidnight - lastMidnight) / (1000 * 60 * 60 * 24));
    return elapsedDays >= intervalDays;
  }

  // If never completed before, it is due on first matching day preference
  return true;
};

/**
 * Determine if a product belongs to a routine (AM / PM)
 */
const isProductInRoutine = (
  p: Product,
  routine: 'AM' | 'PM',
  targetDate: Date = new Date(),
  todayKey: string = getTodayKey()
): boolean => {
  const routineTime = p.routineTime || p.routineType;
  if (routineTime) {
    if (routineTime === 'none') return false;
    if (routine === 'AM' && routineTime !== 'am' && routineTime !== 'both') return false;
    if (routine === 'PM' && routineTime !== 'pm' && routineTime !== 'both') return false;
  } else {
    // Default heuristic for legacy products without routineType
    const cat = (p.category || '').toLowerCase();
    if (routine === 'AM') {
      if (cat.includes('sun') || cat.includes('spf')) return true;
      if (cat.includes('mask') || cat.includes('treat')) return false;
      return true;
    } else {
      if (cat.includes('sun') || cat.includes('spf')) return false;
      return true;
    }
  }

  // Check mask scheduling due check
  return isMaskDue(p, targetDate, todayKey);
};

/**
 * Sort products according to standard skincare application order
 */
const sortProductsForRoutine = (prods: Product[]): Product[] => {
  return [...prods].sort((a, b) => {
    const weightA = a.orderWeight ?? getCategoryMeta(a.category).orderWeight;
    const weightB = b.orderWeight ?? getCategoryMeta(b.category).orderWeight;
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.name.localeCompare(b.name);
  });
};

export default function RoutineScreen() {
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const navigation = useNavigation<NavigationProp<RootTabParamList>>();

  // Active routine tab ('AM' or 'PM')
  const [activeRoutine, setActiveRoutine] = useState<'AM' | 'PM'>(getDefaultRoutineByTime);

  // Dynamic Routine Steps (Initial state is strictly empty array [])
  const [amSteps, setAmSteps] = useState<RoutineStep[]>([]);
  const [pmSteps, setPmSteps] = useState<RoutineStep[]>([]);
  const [cabinetProducts, setCabinetProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isUvModalVisible, setIsUvModalVisible] = useState<boolean>(false);
  const [isCabinetPickerVisible, setIsCabinetPickerVisible] = useState<boolean>(false);

  // Affirmation & Milestones
  const [isAffirmationVisible, setIsAffirmationVisible] = useState<boolean>(false);
  const [currentAffirmation, setCurrentAffirmation] = useState<string>('');
  const [unlockedMilestone, setUnlockedMilestone] = useState<MilestoneDefinition | null>(null);
  const [showMilestoneToast, setShowMilestoneToast] = useState<boolean>(false);

  // Auto-dismiss milestone toast after 4.5 seconds
  useEffect(() => {
    if (showMilestoneToast) {
      const timer = setTimeout(() => {
        setShowMilestoneToast(false);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [showMilestoneToast]);

  // Sync routine tab based on time on initial mount
  useEffect(() => {
    setActiveRoutine(getDefaultRoutineByTime());
  }, []);

  /**
   * Load real products from Digital Cabinet & synchronize completion state
   */
  const loadRoutine = useCallback(async () => {
    try {
      setIsLoading(true);

      // Clean up any old mock routine keys if present
      await AsyncStorage.multiRemove([
        '@skin_diary_am_routine',
        '@skin_diary_pm_routine',
        '@skin_diary_mock_routine',
      ]).catch(() => {});

      const allProducts = await getProducts();
      setCabinetProducts(allProducts);

      const today = getTodayKey();
      const completionRaw = await AsyncStorage.getItem(ROUTINE_COMPLETION_STORAGE_KEY);
      const completionMap: Record<string, { am: string[]; pm: string[] }> = completionRaw
        ? JSON.parse(completionRaw)
        : {};
      const todayCompleted = completionMap[today] || { am: [], pm: [] };

      const amFiltered = sortProductsForRoutine(allProducts.filter(p => isProductInRoutine(p, 'AM')));
      const pmFiltered = sortProductsForRoutine(allProducts.filter(p => isProductInRoutine(p, 'PM')));

      setAmSteps(
        amFiltered.map((p, idx) => ({
          id: p.id,
          order: idx + 1,
          category: p.category,
          name: p.name,
          brand: p.brand || '',
          completed: todayCompleted.am.includes(p.id),
          orderWeight: p.orderWeight ?? getCategoryMeta(p.category).orderWeight,
          imageUri: p.imageUri,
        }))
      );

      setPmSteps(
        pmFiltered.map((p, idx) => ({
          id: p.id,
          order: idx + 1,
          category: p.category,
          name: p.name,
          brand: p.brand || '',
          completed: todayCompleted.pm.includes(p.id),
          orderWeight: p.orderWeight ?? getCategoryMeta(p.category).orderWeight,
          imageUri: p.imageUri,
        }))
      );
    } catch (error) {
      console.error('Failed to load routine steps from products:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload routine whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRoutine();
    }, [loadRoutine])
  );

  const steps = activeRoutine === 'AM' ? amSteps : pmSteps;
  const setSteps = activeRoutine === 'AM' ? setAmSteps : setPmSteps;

  /**
   * Toggle completion checkmark of a step & persist to AsyncStorage
   */
  const toggleStep = async (id: string) => {
    const isAm = activeRoutine === 'AM';
    const targetSteps = isAm ? amSteps : pmSteps;
    const setTargetSteps = isAm ? setAmSteps : setPmSteps;

    const wasAllCompletedBefore =
      targetSteps.length > 0 && targetSteps.every(s => s.completed);

    const updated = targetSteps.map(s => (s.id === id ? { ...s, completed: !s.completed } : s));
    setTargetSteps(updated);

    try {
      const today = getTodayKey();
      const completionRaw = await AsyncStorage.getItem(ROUTINE_COMPLETION_STORAGE_KEY);
      const completionMap: Record<string, { am: string[]; pm: string[] }> = completionRaw
        ? JSON.parse(completionRaw)
        : {};

      if (!completionMap[today]) {
        completionMap[today] = { am: [], pm: [] };
      }

      const completedIds = updated.filter(s => s.completed).map(s => s.id);
      if (isAm) {
        completionMap[today].am = completedIds;
      } else {
        completionMap[today].pm = completedIds;
      }

      await AsyncStorage.setItem(ROUTINE_COMPLETION_STORAGE_KEY, JSON.stringify(completionMap));

      // Update mask's lastCompletedDate if applicable
      const toggled = updated.find(s => s.id === id);
      if (toggled && toggled.completed) {
        const prod = cabinetProducts.find(p => p.id === id);
        if (prod && isMaskProduct(prod)) {
          await updateProduct(id, { lastCompletedDate: today }).catch(err => {
            console.warn('Failed to update mask lastCompletedDate:', err);
          });

          // Check if completing this mask step unlocks mask_ritual milestone
          const newlyMask = await recordMaskStepCompletion();
          if (newlyMask.length > 0) {
            setUnlockedMilestone(newlyMask[0]);
            setShowMilestoneToast(true);
          }
        }
      }

      // Check if routine just reached 100% completion
      const isAllCompletedNow = updated.length > 0 && updated.every(s => s.completed);
      if (!wasAllCompletedBefore && isAllCompletedNow) {
        const isAnyMaskInRoutine = updated.some(s => {
          const prod = cabinetProducts.find(p => p.id === s.id);
          return prod && isMaskProduct(prod);
        });

        const { newlyUnlocked } = await recordRoutineCompletion(
          activeRoutine,
          isAnyMaskInRoutine
        );

        const quote = getRandomAffirmation(activeRoutine, language);
        setCurrentAffirmation(quote);
        setIsAffirmationVisible(true);

        if (newlyUnlocked.length > 0) {
          setUnlockedMilestone(newlyUnlocked[0]);
          setShowMilestoneToast(true);
        }
      }
    } catch (error) {
      console.error('Error saving routine completion state:', error);
    }
  };

  /**
   * Add/Remove a Cabinet product from the active routine
   */
  const handleToggleProductInRoutine = async (product: Product) => {
    try {
      const isAm = activeRoutine === 'AM';
      let newRoutineType: RoutineType;

      const currentlyIn = isProductInRoutine(product, activeRoutine);
      if (currentlyIn) {
        // Remove from this routine
        if (product.routineType === 'both') {
          newRoutineType = isAm ? 'pm' : 'am';
        } else {
          newRoutineType = 'none';
        }
      } else {
        // Add to this routine
        if (isAm) {
          newRoutineType = product.routineType === 'pm' ? 'both' : 'am';
        } else {
          newRoutineType = product.routineType === 'am' ? 'both' : 'pm';
        }
      }

      await updateProduct(product.id, { routineType: newRoutineType });
      await loadRoutine();
    } catch (e) {
      console.error('Error updating product routine allocation:', e);
    }
  };

  const completedCount = steps.filter(s => s.completed).length;

  const handleCompleteRoutine = () => {
    if (completedCount === steps.length && steps.length > 0) {
      const quote = getRandomAffirmation(activeRoutine, language);
      setCurrentAffirmation(quote);
      setIsAffirmationVisible(true);
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
            {
              backgroundColor: isDark ? '#121211' : '#EFECE6',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeRoutine === 'AM' && [
                styles.segmentButtonActive,
                {
                  backgroundColor: isDark ? '#2E2320' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(217, 130, 107, 0.45)' : '#E8E1D8',
                },
              ],
            ]}
            onPress={() => setActiveRoutine('AM')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeRoutine === 'AM' }}
          >
            <View style={styles.segmentContentRow}>
              <Text style={[styles.segmentEmoji, { opacity: activeRoutine === 'AM' ? 1 : 0.55 }]}>
                ☀️
              </Text>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeRoutine === 'AM'
                        ? isDark ? '#FFF7F4' : colors.textPrimary
                        : isDark ? '#8E8E93' : colors.textSecondary,
                    fontWeight: activeRoutine === 'AM' ? '700' : '600',
                  },
                ]}
              >
                {t('morningRoutine')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeRoutine === 'PM' && [
                styles.segmentButtonActive,
                {
                  backgroundColor: isDark ? '#1E2823' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(134, 168, 146, 0.45)' : '#E8E1D8',
                },
              ],
            ]}
            onPress={() => setActiveRoutine('PM')}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeRoutine === 'PM' }}
          >
            <View style={styles.segmentContentRow}>
              <Text style={[styles.segmentEmoji, { opacity: activeRoutine === 'PM' ? 1 : 0.55 }]}>
                🌙
              </Text>
              <Text
                style={[
                  styles.segmentText,
                  {
                    color:
                      activeRoutine === 'PM'
                        ? isDark ? '#F4F8F5' : colors.textPrimary
                        : isDark ? '#8E8E93' : colors.textSecondary,
                    fontWeight: activeRoutine === 'PM' ? '700' : '600',
                  },
                ]}
              >
                {t('eveningRoutine')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Contextual UV Widget (Morning Routine only) */}
        {activeRoutine === 'AM' && (
          <TouchableOpacity
            style={[
              styles.compactUvWidget,
              {
                backgroundColor: isDark ? '#1C261F' : '#F2F6F3',
                borderColor: isDark ? '#2D3E31' : '#DFEAE2',
              },
            ]}
            onPress={() => setIsUvModalVisible(true)}
            activeOpacity={0.75}
            accessibilityLabel="View weather and UV recommendations"
          >
            <View
              style={[
                styles.compactUvIconBox,
                { backgroundColor: isDark ? '#26362B' : '#E3EDE6' },
              ]}
            >
              <Ionicons name="thermometer-outline" size={15} color={colors.secondary} />
            </View>

            <View style={styles.compactUvContent}>
              <Text style={[styles.compactUvIndexText, { color: colors.secondary }]}>
                {t('uvIndexLabel')} 6
              </Text>
              <Text style={[styles.compactUvDot, { color: colors.textMuted }]}>•</Text>
              <Text
                style={[styles.compactUvReminderText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {t('sunscreenRecommendation')}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={14}
              color={colors.secondary}
              style={styles.compactUvChevron}
            />
          </TouchableOpacity>
        )}

        {/* Quick "Edit Routine" action */}
        <View style={styles.sectionHeaderRow}>
          <TouchableOpacity
            style={[
              styles.addStepHeaderButton,
              {
                borderColor: isDark ? '#3D342E' : '#E8E1D8',
                backgroundColor: isDark ? '#26221E' : '#F7F3EE',
              },
            ]}
            onPress={() => setIsCabinetPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={13} color={colors.primary} />
            <Text style={[styles.addStepHeaderText, { color: colors.primary }]}>
              {t('editRoutineBtn')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Minimalist Empty State or Steps Checklist */}
        {isLoading && steps.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : steps.length === 0 ? (
          /* ======================================================== */
          /* Minimalist Luxury Empty State                           */
          /* ======================================================== */
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.emptyStateIconBadge,
                { backgroundColor: isDark ? '#262421' : '#F6F3EE' },
              ]}
            >
              <Text style={styles.emptyStateEmoji}>
                {activeRoutine === 'AM' ? '☀️' : '🌙'}
              </Text>
            </View>

            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>
              {t('emptyRoutineTitle')}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
              {t('emptyRoutineSub')}
            </Text>

            <View style={styles.emptyStateActionsRow}>
              <TouchableOpacity
                style={[styles.emptyStatePrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsCabinetPickerVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.emptyStatePrimaryBtnText}>
                  {t('addFromCabinet')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.emptyStateSecondaryBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: isDark ? '#23211F' : '#FAF8F5',
                  },
                ]}
                onPress={() => navigation.navigate('Cabinet')}
                activeOpacity={0.7}
              >
                <Text style={[styles.emptyStateSecondaryBtnText, { color: colors.textSecondary }]}>
                  {t('goToCabinet')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ======================================================== */
          /* Dynamic Checkable Routine Steps List                    */
          /* ======================================================== */
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

                {step.imageUri ? (
                  <Image source={{ uri: step.imageUri }} style={styles.stepThumbnail} />
                ) : null}

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
                  {step.brand ? (
                    <Text
                      style={[
                        styles.stepBrand,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {step.brand}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Finish Routine Action (Visible only when steps exist) */}
        {steps.length > 0 && (
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
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* Cabinet Products Picker Modal (Add/Manage Routine Steps) */}
      {/* ======================================================== */}
      <Modal
        visible={isCabinetPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCabinetPickerVisible(false)}
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
            <View style={styles.pickerHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>
                  {activeRoutine === 'AM' ? `☀️ ${t('morningRoutine')}` : `🌙 ${t('eveningRoutine')}`}
                </Text>
                <Text style={[styles.pickerSubtitle, { color: colors.textSecondary }]}>
                  {t('routineSelectModalSub')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCabinetPickerVisible(false)}
                style={styles.pickerCloseButton}
              >
                <Text style={[styles.pickerCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* List of Cabinet Products to Toggle */}
            <ScrollView style={styles.pickerScrollView} showsVerticalScrollIndicator={false}>
              {cabinetProducts.length === 0 ? (
                <View style={styles.pickerEmptyBox}>
                  <Text style={styles.pickerEmptyEmoji}>🧴</Text>
                  <Text style={[styles.pickerEmptyText, { color: colors.textSecondary }]}>
                    {t('noProductsInCabinetPrompt')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.pickerGoToCabinetBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setIsCabinetPickerVisible(false);
                      navigation.navigate('Cabinet');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerGoToCabinetBtnText}>{t('goToCabinet')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                cabinetProducts.map(product => {
                  const meta = getCategoryMeta(product.category);
                  const inRoutine = isProductInRoutine(product, activeRoutine);

                  return (
                    <View
                      key={product.id}
                      style={[
                        styles.pickerProductRow,
                        {
                          backgroundColor: inRoutine
                            ? isDark ? '#2D231F' : '#FAF4F1'
                            : isDark ? '#1F1E1B' : '#F9F7F4',
                          borderColor: inRoutine ? colors.primary : colors.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.pickerProductThumb}>
                        {product.imageUri ? (
                          <Image source={{ uri: product.imageUri }} style={styles.thumbImage} />
                        ) : (
                          <Text style={styles.thumbEmoji}>{meta.icon}</Text>
                        )}
                      </View>

                      <View style={styles.pickerProductInfo}>
                        <Text style={[styles.pickerProductName, { color: colors.textPrimary }]}>
                          {product.name}
                        </Text>
                        <Text style={[styles.pickerProductMeta, { color: colors.textSecondary }]}>
                          {product.brand ? `${product.brand} • ` : ''}{getCategoryLabel(meta.key, t)}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.toggleIncludeBtn,
                          inRoutine && {
                            backgroundColor: colors.primary,
                            borderColor: colors.primary,
                          },
                          !inRoutine && {
                            backgroundColor: 'transparent',
                            borderColor: colors.border,
                          },
                        ]}
                        onPress={() => handleToggleProductInRoutine(product)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.toggleIncludeText,
                            { color: inRoutine ? '#FFFFFF' : colors.textPrimary },
                          ]}
                        >
                          {inRoutine ? '✓' : '+'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Done CTA */}
            <TouchableOpacity
              style={[styles.pickerDoneBtn, { backgroundColor: colors.primary }]}
              onPress={() => setIsCabinetPickerVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.pickerDoneBtnText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
                style={styles.modalCloseButton}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* UV & Sun Alert Section */}
            <View style={styles.modalContent}>
              <View style={styles.modalUvHero}>
                <Text style={[styles.modalUvNumber, { color: colors.secondary }]}>6</Text>
                <View style={styles.modalUvHeroText}>
                  <Text style={[styles.modalUvCategory, { color: colors.textPrimary }]}>
                    {t('uvIndexHigh')}
                  </Text>
                  <Text style={[styles.modalUvSub, { color: colors.textSecondary }]}>
                    {t('weatherConditionSunny')}
                  </Text>
                </View>
              </View>

              {/* Protective Ritual Recommendations */}
              <View
                style={[
                  styles.modalTipContainer,
                  {
                    backgroundColor: isDark ? '#1C261F' : '#F2F6F3',
                    borderColor: isDark ? '#2D3E31' : '#DFEAE2',
                  },
                ]}
              >
                <Text style={[styles.modalTipHeading, { color: colors.secondary }]}>
                  🧴 {t('sunscreenRecommendation')}
                </Text>
                <Text style={[styles.modalTipBody, { color: colors.textSecondary }]}>
                  {t('sunscreenTip')}
                </Text>
              </View>
            </View>

            {/* Modal Dismiss Button */}
            <TouchableOpacity
              style={[styles.modalDoneButton, { backgroundColor: colors.secondary }]}
              onPress={() => setIsUvModalVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalDoneButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* Sleek Affirmation Modal (AM & PM Routine Completion)     */}
      {/* ======================================================== */}
      <Modal
        visible={isAffirmationVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAffirmationVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.affirmationCard,
              {
                backgroundColor: colors.card,
                borderColor:
                  activeRoutine === 'AM'
                    ? isDark ? 'rgba(217, 130, 107, 0.4)' : 'rgba(217, 130, 107, 0.3)'
                    : isDark ? 'rgba(134, 168, 146, 0.4)' : 'rgba(134, 168, 146, 0.3)',
              },
            ]}
          >
            {/* Top Icon Badge */}
            <View
              style={[
                styles.affirmationIconCircle,
                {
                  backgroundColor:
                    activeRoutine === 'AM'
                      ? isDark ? '#3D251E' : '#FDF0EC'
                      : isDark ? '#1E2D24' : '#EEF5F1',
                },
              ]}
            >
              <Text style={styles.affirmationIconEmoji}>
                {activeRoutine === 'AM' ? '☀️' : '🌙'}
              </Text>
            </View>

            <Text style={[styles.affirmationTitle, { color: colors.textPrimary }]}>
              {t(activeRoutine === 'AM' ? 'morningAffirmationTitle' : 'eveningAffirmationTitle')}
            </Text>

            <Text
              style={[
                styles.affirmationEyebrow,
                { color: activeRoutine === 'AM' ? colors.primary : colors.secondary },
              ]}
            >
              {t('affirmationDailyQuote')}
            </Text>

            {/* Quote container */}
            <View
              style={[
                styles.affirmationQuoteBox,
                {
                  backgroundColor: isDark ? '#1C1B19' : '#FAF8F5',
                  borderColor: isDark ? '#2D2B28' : '#EFECE6',
                },
              ]}
            >
              <Text style={[styles.affirmationQuoteMark, { color: colors.primary }]}>“</Text>
              <Text style={[styles.affirmationQuoteText, { color: colors.textPrimary }]}>
                {currentAffirmation}
              </Text>
            </View>

            {/* Unlocked Milestone Alert inside Modal if newly unlocked */}
            {unlockedMilestone ? (
              <View
                style={[
                  styles.affirmationMilestonePill,
                  {
                    backgroundColor: isDark ? '#2C2218' : '#FEF8F0',
                    borderColor: isDark ? '#5C442D' : '#F6DFBF',
                  },
                ]}
              >
                <Text style={styles.affirmationMilestoneIcon}>{unlockedMilestone.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.affirmationMilestoneTitle,
                      { color: isDark ? '#F5C78E' : '#92540F' },
                    ]}
                  >
                    {t('milestoneUnlockedToast')}
                  </Text>
                  <Text
                    style={[styles.affirmationMilestoneDesc, { color: colors.textSecondary }]}
                  >
                    {t(unlockedMilestone.titleKey as any)}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Actions */}
            <TouchableOpacity
              style={[
                styles.affirmationPrimaryBtn,
                { backgroundColor: activeRoutine === 'AM' ? colors.primary : colors.secondary },
              ]}
              onPress={() => setIsAffirmationVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.affirmationPrimaryBtnText}>✨ {t('affirmationDismiss')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.affirmationSecondaryBtn}
              onPress={() => {
                setIsAffirmationVisible(false);
                navigation.navigate('Diary');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.affirmationSecondaryBtnText, { color: colors.textSecondary }]}>
                {t('logSkinConditionCta')} →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* Floating Celebratory Milestone Toast Banner             */}
      {/* ======================================================== */}
      {showMilestoneToast && unlockedMilestone && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.toastCard,
              {
                backgroundColor: isDark ? '#26201B' : '#FFFDF9',
                borderColor: isDark ? 'rgba(217, 130, 107, 0.45)' : 'rgba(217, 130, 107, 0.35)',
              },
            ]}
            onPress={() => setShowMilestoneToast(false)}
            activeOpacity={0.9}
          >
            <View style={styles.toastIconCircle}>
              <Text style={styles.toastIconEmoji}>{unlockedMilestone.icon}</Text>
            </View>
            <View style={styles.toastTextCol}>
              <Text style={[styles.toastTitle, { color: colors.primary }]}>
                {t('milestoneUnlockedToast')}
              </Text>
              <Text style={[styles.toastSubtitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {t(unlockedMilestone.titleKey as any)}: {t(unlockedMilestone.descKey as any)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowMilestoneToast(false)}
              style={styles.toastCloseBtn}
            >
              <Ionicons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    padding: 3,
    marginBottom: SPACING.md,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentEmoji: {
    fontSize: 14,
  },
  segmentText: {
    fontSize: 13,
  },
  compactUvWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: 10,
  },
  compactUvIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactUvContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactUvIndexText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  compactUvDot: {
    fontSize: 12,
  },
  compactUvReminderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  compactUvChevron: {
    opacity: 0.7,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  addStepHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  addStepHeaderText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  /* Minimalist Luxury Empty State */
  emptyStateCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  emptyStateIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  emptyStateEmoji: {
    fontSize: 26,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  emptyStateActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  emptyStatePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  emptyStatePrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyStateSecondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
  },
  emptyStateSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  /* Steps List */
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
    marginRight: 12,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepThumbnail: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    marginRight: 10,
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
  /* Picker Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    borderWidth: 1,
    maxHeight: '85%',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  pickerCloseButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCloseText: {
    fontSize: 18,
  },
  pickerScrollView: {
    maxHeight: 380,
    marginVertical: SPACING.xs,
  },
  pickerEmptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  pickerEmptyEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  pickerEmptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  pickerGoToCabinetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  pickerGoToCabinetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  pickerProductThumb: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBE6DE',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbEmoji: {
    fontSize: 18,
  },
  pickerProductInfo: {
    flex: 1,
  },
  pickerProductName: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerProductMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleIncludeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleIncludeText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickerDoneBtn: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  pickerDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  /* UV Modal */
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
  },
  modalContent: {
    marginBottom: SPACING.md,
  },
  modalUvHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  modalUvNumber: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  modalUvHeroText: {
    flex: 1,
  },
  modalUvCategory: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalUvSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalTipContainer: {
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modalTipHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTipBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalDoneButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalDoneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  affirmationCard: {
    width: '90%',
    maxWidth: 380,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  affirmationIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  affirmationIconEmoji: {
    fontSize: 28,
  },
  affirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  affirmationEyebrow: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  affirmationQuoteBox: {
    width: '100%',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  affirmationQuoteMark: {
    fontSize: 32,
    lineHeight: 32,
    height: 24,
    fontWeight: '700',
    opacity: 0.6,
  },
  affirmationQuoteText: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: -0.2,
    paddingHorizontal: SPACING.xs,
  },
  affirmationMilestonePill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    padding: 10,
    marginBottom: SPACING.md,
    gap: 10,
  },
  affirmationMilestoneIcon: {
    fontSize: 22,
  },
  affirmationMilestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  affirmationMilestoneDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  affirmationPrimaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  affirmationPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  affirmationSecondaryBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  affirmationSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  toastIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(217, 130, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastIconEmoji: {
    fontSize: 20,
  },
  toastTextCol: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toastSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  toastCloseBtn: {
    padding: 4,
  },
});
