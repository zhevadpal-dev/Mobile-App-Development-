import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SPACING, RADIUS } from '../constants/theme';
import { PixelAvatarConfig } from '../types/auth';
import {
  PixelAvatar,
  DEFAULT_PIXEL_AVATAR,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  GLASSES_OPTIONS,
  OUTFIT_COLORS,
  BG_COLORS,
} from './PixelAvatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CategoryTab = 'hair' | 'skin' | 'glasses' | 'outfit' | 'backdrop';

export interface AvatarCreatorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (config: PixelAvatarConfig) => void;
}

export default function AvatarCreatorModal({
  visible,
  onClose,
  onSaved,
}: AvatarCreatorModalProps) {
  const { colors, isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const { language } = useLanguage();
  const isTr = language === 'tr';

  // Initial config from user or default
  const [config, setConfig] = useState<PixelAvatarConfig>(
    user?.pixelAvatar || DEFAULT_PIXEL_AVATAR
  );
  const [activeTab, setActiveTab] = useState<CategoryTab>('hair');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Sync draft config whenever modal opens
  useEffect(() => {
    if (visible) {
      if (user?.pixelAvatar) {
        setConfig(user.pixelAvatar);
      } else {
        setConfig({
          ...DEFAULT_PIXEL_AVATAR,
          bgColor: user?.avatarBgColor || DEFAULT_PIXEL_AVATAR.bgColor,
        });
      }
    }
  }, [visible, user?.pixelAvatar, user?.avatarBgColor]);

  const handleRandomize = () => {
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].color;
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].color;
    const randomGlasses = GLASSES_OPTIONS[Math.floor(Math.random() * GLASSES_OPTIONS.length)].id;
    const randomOutfit = OUTFIT_COLORS[Math.floor(Math.random() * OUTFIT_COLORS.length)].color;
    const randomBg = BG_COLORS[Math.floor(Math.random() * BG_COLORS.length)].color;

    setConfig({
      skinTone: randomSkin,
      hairStyle: randomHairStyle,
      hairColor: randomHairColor,
      glasses: randomGlasses,
      outfitColor: randomOutfit,
      bgColor: randomBg,
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile({
        pixelAvatar: config,
        photoUri: null, // Clear photoUri so pixel avatar becomes active immediately
        avatarBgColor: config.bgColor,
      });
      onSaved?.(config);
      onClose();
    } catch (error) {
      console.error('Failed to save pixel avatar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs: { key: CategoryTab; label: string; icon: string }[] = [
    { key: 'hair', label: isTr ? 'Saç' : 'Hair', icon: '💇' },
    { key: 'skin', label: isTr ? 'Ten' : 'Skin', icon: '✨' },
    { key: 'glasses', label: isTr ? 'Gözlük' : 'Glasses', icon: '👓' },
    { key: 'outfit', label: isTr ? 'Kıyafet' : 'Outfit', icon: '👘' },
    { key: 'backdrop', label: isTr ? 'Arka Plan' : 'Backdrop', icon: '🎨' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Grabber */}
          <View style={styles.grabberWrapper}>
            <View
              style={[
                styles.grabberBar,
                { backgroundColor: isDark ? '#3D3834' : '#E0DCD6' },
              ]}
            />
          </View>

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextGroup}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                {isTr ? '8-Bit Avatar Oluşturucu' : '8-Bit Pixel Avatar'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {isTr
                  ? 'Kişiselleştirilmiş retro cilt ritüeli portren'
                  : 'Customize your cozy retro skincare portrait'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? '#2D2926' : '#F2EFEB' },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel="Close avatar creator"
            >
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Large Live Preview Section */}
          <View
            style={[
              styles.previewArea,
              {
                backgroundColor: isDark ? '#141312' : '#F9F7F3',
                borderColor: isDark ? '#2C2723' : '#EBE6DE',
              },
            ]}
          >
            <View style={styles.avatarPreviewRing}>
              <PixelAvatar config={config} size={112} />
            </View>

            <TouchableOpacity
              style={[
                styles.randomizeButton,
                {
                  borderColor: isDark ? '#3D3630' : '#E2DCD4',
                  backgroundColor: isDark ? '#25211E' : '#FFFFFF',
                },
              ]}
              onPress={handleRandomize}
              activeOpacity={0.75}
            >
              <Text style={styles.randomizeIcon}>🎲</Text>
              <Text style={[styles.randomizeText, { color: colors.textPrimary }]}>
                {isTr ? 'Rastgele' : 'Randomize'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Category Tabs */}
          <View style={[styles.tabsRow, { borderBottomColor: isDark ? '#2A2623' : '#EFECE6' }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {tabs.map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tabItem,
                      isActive && {
                        backgroundColor: isDark ? '#38251E' : '#F6EAE5',
                        borderColor: colors.primary,
                      },
                      !isActive && {
                        backgroundColor: 'transparent',
                        borderColor: 'transparent',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.tabIcon}>{tab.icon}</Text>
                    <Text
                      style={[
                        styles.tabLabel,
                        {
                          color: isActive ? colors.primary : colors.textMuted,
                          fontWeight: isActive ? '700' : '500',
                        },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Options Content Area */}
          <ScrollView
            style={styles.optionsScrollView}
            contentContainerStyle={styles.optionsContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Hair Options */}
            {activeTab === 'hair' && (
              <View style={styles.tabSection}>
                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
                  {isTr ? 'SAÇ MODELİ' : 'HAIR STYLE'}
                </Text>
                <View style={styles.chipsRow}>
                  {HAIR_STYLES.map(style => {
                    const isSelected = config.hairStyle === style.id;
                    return (
                      <TouchableOpacity
                        key={style.id}
                        onPress={() => setConfig(prev => ({ ...prev, hairStyle: style.id }))}
                        style={[
                          styles.chipButton,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#38251E'
                                : '#F6EAE5'
                              : isDark
                              ? '#25211E'
                              : '#F4F1EB',
                            borderColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.chipIcon}>{style.icon}</Text>
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? colors.primary : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {style.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text
                  style={[
                    styles.subSectionTitle,
                    { color: colors.textSecondary, marginTop: SPACING.md },
                  ]}
                >
                  {isTr ? 'SAÇ RENGİ' : 'HAIR COLOR'}
                </Text>
                <View style={styles.swatchesRow}>
                  {HAIR_COLORS.map(colorOpt => {
                    const isSelected =
                      config.hairColor.toLowerCase() === colorOpt.color.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={colorOpt.id}
                        onPress={() => setConfig(prev => ({ ...prev, hairColor: colorOpt.color }))}
                        style={[
                          styles.swatchWrapper,
                          isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                        ]}
                        activeOpacity={0.75}
                        accessibilityLabel={colorOpt.label}
                      >
                        <View style={[styles.swatchInner, { backgroundColor: colorOpt.color }]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 2. Skin Tone Options */}
            {activeTab === 'skin' && (
              <View style={styles.tabSection}>
                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
                  {isTr ? 'TEN TONU' : 'SKIN COMPLEXION'}
                </Text>
                <View style={styles.swatchesRow}>
                  {SKIN_TONES.map(tone => {
                    const isSelected =
                      config.skinTone.toLowerCase() === tone.color.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={tone.id}
                        onPress={() => setConfig(prev => ({ ...prev, skinTone: tone.color }))}
                        style={[
                          styles.swatchWrapper,
                          isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                        ]}
                        activeOpacity={0.75}
                        accessibilityLabel={tone.label}
                      >
                        <View style={[styles.swatchInner, { backgroundColor: tone.color }]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 3. Glasses / Accessories Options */}
            {activeTab === 'glasses' && (
              <View style={styles.tabSection}>
                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
                  {isTr ? 'GÖZLÜK & AKSESUAR' : 'GLASSES & ACCENTS'}
                </Text>
                <View style={styles.chipsRow}>
                  {GLASSES_OPTIONS.map(opt => {
                    const isSelected = config.glasses === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setConfig(prev => ({ ...prev, glasses: opt.id }))}
                        style={[
                          styles.chipButton,
                          {
                            backgroundColor: isSelected
                              ? isDark
                                ? '#38251E'
                                : '#F6EAE5'
                              : isDark
                              ? '#25211E'
                              : '#F4F1EB',
                            borderColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.chipIcon}>{opt.icon}</Text>
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? colors.primary : colors.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 4. Outfit Color Options */}
            {activeTab === 'outfit' && (
              <View style={styles.tabSection}>
                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
                  {isTr ? 'KIYAFET RENGİ' : 'OUTFIT PALETTE'}
                </Text>
                <View style={styles.swatchesRow}>
                  {OUTFIT_COLORS.map(colorOpt => {
                    const isSelected =
                      config.outfitColor.toLowerCase() === colorOpt.color.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={colorOpt.id}
                        onPress={() =>
                          setConfig(prev => ({ ...prev, outfitColor: colorOpt.color }))
                        }
                        style={[
                          styles.swatchWrapper,
                          isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                        ]}
                        activeOpacity={0.75}
                        accessibilityLabel={colorOpt.label}
                      >
                        <View style={[styles.swatchInner, { backgroundColor: colorOpt.color }]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 5. Backdrop Color Options */}
            {activeTab === 'backdrop' && (
              <View style={styles.tabSection}>
                <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
                  {isTr ? 'ARKA PLAN TONU' : 'BACKDROP TINT'}
                </Text>
                <View style={styles.swatchesRow}>
                  {BG_COLORS.map(colorOpt => {
                    const isSelected =
                      config.bgColor.toLowerCase() === colorOpt.color.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={colorOpt.id}
                        onPress={() => setConfig(prev => ({ ...prev, bgColor: colorOpt.color }))}
                        style={[
                          styles.swatchWrapper,
                          isSelected && { borderColor: colors.primary, borderWidth: 2.5 },
                        ]}
                        activeOpacity={0.75}
                        accessibilityLabel={colorOpt.label}
                      >
                        <View style={[styles.swatchInner, { backgroundColor: colorOpt.color }]} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Save Action Button */}
          <View
            style={[
              styles.footerContainer,
              {
                borderTopColor: isDark ? '#2A2623' : '#EFECE6',
                backgroundColor: isDark ? '#1C1A18' : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.primary },
                isSaving && { opacity: 0.8 },
              ]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isTr ? 'Avatarı Kaydet ✨' : 'Save Avatar ✨'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: SPACING.xs,
  },
  grabberWrapper: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  headerTextGroup: {
    flex: 1,
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  avatarPreviewRing: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  randomizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  randomizeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  randomizeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabsRow: {
    borderBottomWidth: 1,
    marginTop: SPACING.xs,
  },
  tabsScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  tabIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 12,
  },
  optionsScrollView: {
    minHeight: 180,
    maxHeight: 220,
  },
  optionsContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  tabSection: {
    width: '100%',
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 4,
  },
  swatchWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 3,
    borderColor: 'transparent',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  footerContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
