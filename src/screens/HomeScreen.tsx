import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, RADIUS } from '../constants/theme';
import { RootTabParamList, MainStackParamList } from '../types/navigation';

/**
 * Determine dynamic greeting based on device's current local hour:
 * - 05:00 to 11:59 -> Morning ('Good morning')
 * - 12:00 to 16:59 -> Afternoon ('Good afternoon')
 * - 17:00 to 04:59 -> Evening ('Good evening')
 */
const getGreetingKey = (hour: number): 'goodMorning' | 'goodAfternoon' | 'goodEvening' => {
  if (hour >= 5 && hour < 12) {
    return 'goodMorning';
  }
  if (hour >= 12 && hour < 17) {
    return 'goodAfternoon';
  }
  return 'goodEvening';
};

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp<MainStackParamList & RootTabParamList>>();

  // Interactive UV & Sunscreen recommendation modal visibility
  const [isUvModalVisible, setIsUvModalVisible] = useState<boolean>(false);

  // Dynamic greeting state based on the device's current time
  const [greetingKey, setGreetingKey] = useState<'goodMorning' | 'goodAfternoon' | 'goodEvening'>(
    () => getGreetingKey(new Date().getHours())
  );

  // State variable for the user's first name, defaulting to 'Zeynep'
  const [firstName, setFirstName] = useState<string>(() => {
    if (user?.name && user.name.trim().length > 0) {
      return user.name.trim().split(' ')[0];
    }
    return 'Zeynep';
  });

  // Keep dynamic greeting updated as time advances
  useEffect(() => {
    const updateTimeBasedGreeting = () => {
      const currentHour = new Date().getHours();
      setGreetingKey(getGreetingKey(currentHour));
    };

    updateTimeBasedGreeting();
    const timer = setInterval(updateTimeBasedGreeting, 60000); // Check every minute
    return () => clearInterval(timer);
  }, []);

  // Synchronize first name if user profile updates in AuthContext
  useEffect(() => {
    if (user?.name && user.name.trim().length > 0) {
      const first = user.name.trim().split(' ')[0];
      if (first) {
        setFirstName(first);
      }
    }
  }, [user?.name]);

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const userInitial = firstName ? firstName.charAt(0).toUpperCase() : 'Z';
  const photoUri = user?.photoUri;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* ======================================================== */}
      {/* Home Screen Header: Top Row (Greeting & Avatar)          */}
      {/* ======================================================== */}
      <View style={styles.header}>
        {/* Top Left: Dynamic Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
            {t(greetingKey)},{' '}
            <Text style={[styles.nameHighlight, { color: colors.primary }]}>
              {firstName}
            </Text>
          </Text>
        </View>

        {/* Top Right: Profile Avatar */}
        <TouchableOpacity
          style={[
            styles.avatarButton,
            {
              backgroundColor: isDark ? '#2D221D' : '#FBECE8',
              borderColor: colors.primary,
            },
          ]}
          onPress={handleOpenSettings}
          activeOpacity={0.75}
          accessibilityLabel="Open settings and profile"
        >
          {photoUri?.startsWith('avatar:') ? (
            <Text style={styles.avatarEmojiText}>
              {photoUri.replace('avatar:', '')}
            </Text>
          ) : photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.avatarInitialText, { color: colors.primary }]}>
              {userInitial}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* ======================================================== */}
      {/* Vertically Centered Main Card Container                 */}
      {/* ======================================================== */}
      <View style={styles.cardCenterWrapper}>
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.heroCardHeader}>
            <View
              style={[
                styles.heroIconBadge,
                { backgroundColor: colors.secondaryLight },
              ]}
            >
              <Text style={styles.heroIconText}>🌿</Text>
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={[styles.heroCardTitle, { color: colors.textPrimary }]}>
                {t('welcomeBack')}
              </Text>
              <Text style={[styles.heroCardSubtitle, { color: colors.textSecondary }]}>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Quick Shortcuts */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={[
                styles.actionChip,
                { backgroundColor: colors.primaryLight, borderColor: colors.primary },
              ]}
              onPress={() => navigation.navigate('Routine')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipIcon}>☀️</Text>
              <Text style={[styles.actionChipText, { color: colors.primary }]}>
                {t('startRoutineCta')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                { backgroundColor: colors.secondaryLight, borderColor: colors.secondary },
              ]}
              onPress={() => navigation.navigate('Cabinet')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipIcon}>🧴</Text>
              <Text style={[styles.actionChipText, { color: colors.secondary }]}>
                {t('viewCabinetCta')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                {
                  backgroundColor: isDark ? '#2A2522' : '#F4EFEB',
                  borderColor: colors.border,
                },
              ]}
              onPress={() => navigation.navigate('Diary')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipIcon}>✨</Text>
              <Text style={[styles.actionChipText, { color: colors.textPrimary }]}>
                {t('logSkinConditionCta')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ======================================================== */}
      {/* Floating UV & Sun Button (Bottom Corner)                 */}
      {/* ======================================================== */}
      <TouchableOpacity
        style={[
          styles.floatingUvButton,
          {
            backgroundColor: isDark ? '#2A201A' : '#FFFFFF',
            borderColor: isDark ? '#3D2F28' : '#EDE4DA',
          },
        ]}
        onPress={() => setIsUvModalVisible(true)}
        activeOpacity={0.85}
        accessibilityLabel="View weather and UV recommendations"
      >
        <Ionicons name="sunny" size={26} color={colors.accent} />
      </TouchableOpacity>

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
  /* Header Layout */
  header: {
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
  },
  greetingContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  nameHighlight: {
    fontWeight: '700',
  },
  /* Profile Avatar */
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  avatarEmojiText: {
    fontSize: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  /* Floating UV Button */
  floatingUvButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
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
  /* Center Wrapper: Vertically centers card in remaining space */
  cardCenterWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingBottom: SPACING.lg,
  },
  /* Hero Card for Agile Scaffold */
  heroCard: {
    width: '92%',
    alignSelf: 'center',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  heroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconText: {
    fontSize: 22,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroCardSubtitle: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  quickActionsRow: {
    gap: 12,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  actionChipIcon: {
    fontSize: 16,
  },
  actionChipText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
