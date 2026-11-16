import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, RADIUS } from '../constants/theme';
import { RootTabParamList, MainStackParamList } from '../types/navigation';

/**
 * Cute Animal Emojis available for avatar personalization
 */
const CUTE_ANIMAL_EMOJIS = ['🧸', '🐱', '🐼', '🐰', '🐶', '🦊', '🐨', '🐣'];

interface PastelColorOption {
  id: string;
  name: string;
  color: string;
}

/**
 * Soft, premium pastel background color swatches
 */
const getPastelColorSwatches = (isDark: boolean): PastelColorOption[] => [
  { id: 'default', name: 'Classic', color: isDark ? '#2D221D' : '#FBECE8' },
  { id: 'sage', name: 'Sage', color: '#DCE8DE' },
  { id: 'cream', name: 'Cream', color: '#F7F2E7' },
  { id: 'softPink', name: 'Soft Pink', color: '#FCE6EB' },
  { id: 'lavender', name: 'Lavender', color: '#EBE5F7' },
  { id: 'peach', name: 'Peach', color: '#FCE8D5' },
];

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
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();
  const navigation = useNavigation<NavigationProp<MainStackParamList & RootTabParamList>>();

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

  // Default avatar background color matching the theme
  const defaultBgColor = isDark ? '#2D221D' : '#FBECE8';

  // Interactive Avatar Customizer state variables
  const [avatarEmoji, setAvatarEmoji] = useState<string>(() => {
    if (user?.photoUri?.startsWith('avatar:')) {
      const savedEmoji = user.photoUri.replace('avatar:', '');
      if (savedEmoji) return savedEmoji;
    }
    return '🧸';
  });
  const [avatarBgColor, setAvatarBgColor] = useState<string>(defaultBgColor);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState<boolean>(false);

  // Temporary selection state within the customization modal
  const [selectedEmoji, setSelectedEmoji] = useState<string>(avatarEmoji);
  const [selectedBgColor, setSelectedBgColor] = useState<string>(avatarBgColor);

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

  const handleOpenAvatarModal = () => {
    setSelectedEmoji(avatarEmoji);
    setSelectedBgColor(avatarBgColor);
    setIsAvatarModalVisible(true);
  };

  const handleCloseAvatarModal = () => {
    setIsAvatarModalVisible(false);
  };

  const handleSaveAvatar = async () => {
    setAvatarEmoji(selectedEmoji);
    setAvatarBgColor(selectedBgColor);
    setIsAvatarModalVisible(false);
    try {
      await updateProfile({ photoUri: `avatar:${selectedEmoji}` });
    } catch (e) {
      console.warn('Could not persist avatar to profile:', e);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* ======================================================== */}
      {/* Home Screen Header: Top Row (Greeting & Avatar)          */}
      {/* ======================================================== */}
      <View style={styles.header}>
        {/* Top Left: Dynamic Greeting with Softer, Elegant Name Typography */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
            {t(greetingKey)},{' '}
            <Text style={[styles.nameHighlight, { color: colors.primary }]}>
              {firstName}
            </Text>
          </Text>
        </View>

        {/* Top Right: Interactive Profile Avatar Customizer */}
        <TouchableOpacity
          style={[
            styles.avatarButton,
            {
              backgroundColor: avatarBgColor,
              borderColor: colors.primary,
            },
          ]}
          onPress={handleOpenAvatarModal}
          activeOpacity={0.75}
          accessibilityLabel="Customize avatar"
        >
          <Text style={styles.avatarEmojiText}>{avatarEmoji}</Text>
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
      {/* Interactive Avatar Customizer Modal                     */}
      {/* ======================================================== */}
      <Modal
        visible={isAvatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseAvatarModal}
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
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalHeaderEmoji}>✨</Text>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {t('customizeAvatar')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseAvatarModal}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Live Avatar Preview */}
            <View style={styles.previewSection}>
              <View
                style={[
                  styles.previewAvatarCircle,
                  {
                    backgroundColor: selectedBgColor,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.previewAvatarEmoji}>{selectedEmoji}</Text>
              </View>
            </View>

            {/* Emoji Selection */}
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
              {t('chooseEmoji')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.emojiScrollContainer}
            >
              {CUTE_ANIMAL_EMOJIS.map(emoji => {
                const isSelected = selectedEmoji === emoji;
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiCard,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : isDark
                          ? '#262320'
                          : '#F9F7F4',
                        borderColor: isSelected ? colors.primary : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedEmoji(emoji)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Background Color Selection */}
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.textSecondary, marginTop: SPACING.md },
              ]}
            >
              {t('chooseBgColor')}
            </Text>
            <View style={styles.swatchesRow}>
              {getPastelColorSwatches(isDark).map(swatch => {
                const isSelected = selectedBgColor === swatch.color;
                return (
                  <TouchableOpacity
                    key={swatch.id}
                    style={[
                      styles.swatchTouchTarget,
                      isSelected && { borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedBgColor(swatch.color)}
                    activeOpacity={0.8}
                    accessibilityLabel={swatch.name}
                  >
                    <View
                      style={[
                        styles.swatchCircle,
                        {
                          backgroundColor: swatch.color,
                          borderColor: isSelected
                            ? 'transparent'
                            : isDark
                            ? '#3D3833'
                            : '#E3DDD5',
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={15}
                          color={swatch.id === 'default' && isDark ? '#FFFFFF' : colors.primary}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Save / Done CTA */}
            <TouchableOpacity
              style={[
                styles.modalSaveButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleSaveAvatar}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSaveButtonText}>{t('done')}</Text>
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
    fontWeight: '500',
    letterSpacing: -0.2,
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
  avatarEmojiText: {
    fontSize: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },
  /* Avatar Customizer Modal Styles */
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
    marginBottom: SPACING.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderEmoji: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSection: {
    alignItems: 'center',
    marginVertical: SPACING.sm,
  },
  previewAvatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  previewAvatarEmoji: {
    fontSize: 36,
    textAlign: 'center',
    includeFontPadding: false,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  emojiScrollContainer: {
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  emojiCard: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 26,
    textAlign: 'center',
    includeFontPadding: false,
  },
  swatchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  swatchTouchTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  modalSaveButton: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
