import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../constants/translations';
import { SPACING, RADIUS } from '../constants/theme';
import {
  AVATAR_EMOJI_STORAGE_KEY,
  AVATAR_BG_COLOR_STORAGE_KEY,
} from '../services/authStorage';

export interface CuteAvatarOption {
  key: string;
  emoji: string;
  labelKey: TranslationKey;
}

/**
 * Single Source of Truth for cute avatar options
 */
export const CUTE_AVATARS: CuteAvatarOption[] = [
  { key: 'botanical', emoji: '🌿', labelKey: 'avatarBotanical' },
  { key: 'radiance', emoji: '✨', labelKey: 'avatarRadiance' },
  { key: 'blossom', emoji: '🌸', labelKey: 'avatarBlossom' },
  { key: 'bear', emoji: '🧸', labelKey: 'avatarBear' },
  { key: 'bubbles', emoji: '🫧', labelKey: 'avatarBubbles' },
  { key: 'matcha', emoji: '🍵', labelKey: 'avatarMatcha' },
  { key: 'honey', emoji: '🍯', labelKey: 'avatarHoney' },
  { key: 'barrier', emoji: '🥑', labelKey: 'avatarBarrier' },
  { key: 'kitten', emoji: '🐱', labelKey: 'avatarKitten' },
  { key: 'bunny', emoji: '🐰', labelKey: 'avatarBunny' },
  { key: 'panda', emoji: '🐼', labelKey: 'avatarPanda' },
  { key: 'puppy', emoji: '🐶', labelKey: 'avatarPuppy' },
];

export interface PastelColorOption {
  id: string;
  name: string;
  color: string;
}

/**
 * Soft, premium pastel background color swatches
 */
export const getPastelColorSwatches = (isDark: boolean): PastelColorOption[] => [
  { id: 'default', name: 'Classic', color: isDark ? '#2D221D' : '#FBECE8' },
  { id: 'sage', name: 'Sage', color: '#DCE8DE' },
  { id: 'cream', name: 'Cream', color: '#F7F2E7' },
  { id: 'softPink', name: 'Soft Pink', color: '#FCE6EB' },
  { id: 'lavender', name: 'Lavender', color: '#EBE5F7' },
  { id: 'peach', name: 'Peach', color: '#FCE8D5' },
];

export interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (emoji: string, bgColor: string) => void;
}

/**
 * Unified, reusable Avatar Picker Modal component
 * Provides synchronized global avatar selection with grid layout & pastel tints
 */
export default function AvatarPickerModal({
  visible,
  onClose,
  onSaved,
}: AvatarPickerModalProps) {
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();

  const defaultBgColor = isDark ? '#2D221D' : '#FBECE8';

  // Compute current global avatar values
  const currentGlobalEmoji = user?.photoUri?.startsWith('avatar:')
    ? user.photoUri.replace('avatar:', '')
    : '🧸';
  const currentGlobalBgColor = user?.avatarBgColor || defaultBgColor;

  // Local draft states within the modal
  const [selectedEmoji, setSelectedEmoji] = useState<string>(currentGlobalEmoji);
  const [selectedBgColor, setSelectedBgColor] = useState<string>(currentGlobalBgColor);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync draft states when modal opens
  useEffect(() => {
    if (visible) {
      const emoji = user?.photoUri?.startsWith('avatar:')
        ? user.photoUri.replace('avatar:', '')
        : '🧸';
      setSelectedEmoji(emoji);
      setSelectedBgColor(user?.avatarBgColor || defaultBgColor);
    }
  }, [visible, user?.photoUri, user?.avatarBgColor, defaultBgColor]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 1. Update AuthContext globally (immediately triggers re-renders across all screens)
      await updateProfile({
        photoUri: `avatar:${selectedEmoji}`,
        avatarBgColor: selectedBgColor,
      });

      // 2. Persist to standalone AsyncStorage keys for backup / instant cold retrieval
      await AsyncStorage.multiSet([
        [AVATAR_EMOJI_STORAGE_KEY, selectedEmoji],
        [AVATAR_BG_COLOR_STORAGE_KEY, selectedBgColor],
      ]);

      if (onSaved) {
        onSaved(selectedEmoji, selectedBgColor);
      }
    } catch (error) {
      console.error('Error saving avatar in AvatarPickerModal:', error);
    } finally {
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
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
            <View style={styles.modalTitleContainer}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalHeaderIcon}>✨</Text>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {t('cuteAvatars')}
                </Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {t('avatarSheetSubtitle')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.modalCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
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

            {/* Grid Layout of Cute Avatars (Unified Design from Profile Settings) */}
            <View style={styles.cuteAvatarGrid}>
              {CUTE_AVATARS.map(item => {
                const isSelected = selectedEmoji === item.emoji;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.cuteAvatarCard,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#3D2821'
                            : colors.primaryLight
                          : isDark
                          ? '#23201D'
                          : '#FAF8F5',
                        borderColor: isSelected
                          ? colors.primary
                          : colors.cardBorder,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                    onPress={() => setSelectedEmoji(item.emoji)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.cuteAvatarEmoji}>{item.emoji}</Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cuteAvatarLabel,
                        {
                          color: isSelected ? colors.primary : colors.textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {t(item.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Background Color Swatches */}
            <Text
              style={[
                styles.sectionHeading,
                { color: colors.textSecondary, marginTop: SPACING.sm },
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
                          color={
                            swatch.id === 'default' && isDark
                              ? '#FFFFFF'
                              : colors.primary
                          }
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
                { backgroundColor: colors.primary, opacity: isSaving ? 0.7 : 1 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <Text style={styles.modalSaveButtonText}>{t('done')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 370,
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  modalTitleContainer: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  modalHeaderIcon: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: SPACING.xs,
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
  cuteAvatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: SPACING.xs,
  },
  cuteAvatarCard: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  cuteAvatarEmoji: {
    fontSize: 26,
    marginBottom: 3,
    includeFontPadding: false,
  },
  cuteAvatarLabel: {
    fontSize: 9.5,
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  swatchesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  swatchTouchTarget: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
