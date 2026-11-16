import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Switch,
  Alert,
  Modal,
  Platform,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../constants/translations';
import { SPACING, RADIUS } from '../constants/theme';
import AvatarPickerModal from '../components/AvatarPickerModal';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(user?.photoUri);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [isAvatarPickerVisible, setIsAvatarPickerVisible] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [hasUnsavedNameChange, setHasUnsavedNameChange] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setPhotoUri(user?.photoUri);
  }, [user]);

  const handleNameChange = (text: string) => {
    setName(text);
    setHasUnsavedNameChange(text.trim() !== (user?.name || '').trim());
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      Alert.alert(t('invalidName'), t('nameCannotBeEmpty'));
      return;
    }

    try {
      setIsSavingName(true);
      await updateProfile({ name: name.trim() });
      setHasUnsavedNameChange(false);
      Alert.alert(t('savedAlert'), t('nameUpdated'));
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert(t('saveFailed'), t('couldNotSaveName'));
    } finally {
      setIsSavingName(false);
    }
  };

  const openSheet = () => {
    handleOpenActionMenu();
  };

  /**
   * Action Menu: Native ActionSheet on iOS or Bottom Sheet Menu on Android/Fallback
   * Options in exact requested order:
   * 1. 'Take a Photo' (opens camera)
   * 2. 'Choose from Gallery' (opens camera roll)
   * 3. 'Choose Cute Avatar' (opens custom AvatarPickerModal)
   * 4. 'Cancel'
   */
  const handleOpenActionMenu = () => {
    if (Platform.OS === 'ios') {
      const options = photoUri
        ? [t('takePhoto'), t('chooseGallery'), t('chooseAvatar'), t('removePhoto'), t('cancel')]
        : [t('takePhoto'), t('chooseGallery'), t('chooseAvatar'), t('cancel')];
      const cancelIndex = options.length - 1;
      const destructiveIndex = photoUri ? 3 : undefined;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: cancelIndex,
          destructiveButtonIndex: destructiveIndex,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            handleTakePhoto();
          } else if (buttonIndex === 1) {
            handleChooseFromGallery();
          } else if (buttonIndex === 2) {
            setIsAvatarPickerVisible(true);
          } else if (photoUri && buttonIndex === 3) {
            handleRemovePhoto();
          }
        }
      );
    } else {
      setIsSheetVisible(true);
    }
  };

  /**
   * 2. Choose from Gallery
   */
  const handleChooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('photoPermissionNeeded'),
          t('photoPermissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const pickedUri = result.assets[0].uri;
        setIsSheetVisible(false);
        setPhotoUri(pickedUri);
        await updateProfile({ photoUri: pickedUri });
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert(t('saveFailed'), t('couldNotOpenGallery'));
    }
  };

  /**
   * 3. Take a Photo with Camera
   */
  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('cameraPermissionNeeded'),
          t('cameraPermissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const takenUri = result.assets[0].uri;
        setIsSheetVisible(false);
        setPhotoUri(takenUri);
        await updateProfile({ photoUri: takenUri });
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('saveFailed'), t('couldNotLaunchCamera'));
    }
  };

  /**
   * Remove Photo / Avatar
   */
  const handleRemovePhoto = async () => {
    try {
      setIsSheetVisible(false);
      setPhotoUri(undefined);
      await updateProfile({ photoUri: null });
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logOut'),
      t('logOutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logOut'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const userInitial = (name || user?.name || 'Z').trim().charAt(0).toUpperCase();
  const isAvatarEmoji = photoUri?.startsWith('avatar:');
  const isActualPhoto = Boolean(photoUri && !isAvatarEmoji);
  const avatarEmojiChar = isAvatarEmoji && photoUri ? photoUri.replace('avatar:', '') : '🧸';
  const avatarBgColor = user?.avatarBgColor || (isDark ? '#3A231C' : '#FBECE8');

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Settings Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>{t('settingsTitle')}</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeButton, { backgroundColor: isDark ? '#23211F' : '#EFECE6' }]}
          activeOpacity={0.7}
          accessibilityLabel="Close settings"
        >
          <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕ {t('done')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Profile Management */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: colors.textMuted }]}>
            {t('profileManagement')}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Avatar Row */}
            <View style={styles.avatarSection}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handleOpenActionMenu}
                activeOpacity={0.8}
                accessibilityLabel="Edit profile photo"
              >
                {isActualPhoto && photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.largeAvatarImage} />
                ) : (
                  <View
                    style={[
                      styles.largeAvatarPlaceholder,
                      { backgroundColor: avatarBgColor },
                    ]}
                  >
                    <Text style={styles.largeAvatarEmoji}>{avatarEmojiChar}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.avatarActionContainer}>
                <TouchableOpacity
                  style={[
                    styles.editPhotoButton,
                    {
                      borderColor: colors.primary,
                      backgroundColor: isDark ? '#38251E' : '#FBF0EC',
                    },
                  ]}
                  onPress={handleOpenActionMenu}
                  activeOpacity={0.7}
                  accessibilityLabel="Edit profile photo"
                >
                  <Text style={[styles.editPhotoText, { color: colors.primary }]}>
                    {photoUri ? t('editPhoto') : t('uploadPhoto')}
                  </Text>
                </TouchableOpacity>

                {photoUri ? (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.removePhotoText, { color: colors.textMuted }]}>
                      {t('removePhoto')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Edit Name Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('name')}</Text>
                {hasUnsavedNameChange ? (
                  <Text style={[styles.unsavedBadge, { color: colors.primary }]}>{t('unsaved')}</Text>
                ) : null}
              </View>
              <View style={styles.nameInputRow}>
                <TextInput
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: isDark ? '#191816' : '#FAF8F5',
                      borderColor: hasUnsavedNameChange ? colors.primary : colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  value={name}
                  onChangeText={handleNameChange}
                  placeholder={t('name')}
                  placeholderTextColor={colors.textMuted}
                  maxLength={40}
                  autoCapitalize="words"
                />
                {hasUnsavedNameChange ? (
                  <TouchableOpacity
                    style={[styles.saveNameButton, { backgroundColor: colors.primary }]}
                    onPress={handleSaveName}
                    disabled={isSavingName}
                    activeOpacity={0.8}
                  >
                    {isSavingName ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveNameButtonText}>{t('save')}</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Email (Read-Only) */}
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('email')}</Text>
              <View
                style={[
                  styles.readOnlyBox,
                  {
                    backgroundColor: isDark ? '#191816' : '#FAF8F5',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <Text style={[styles.readOnlyText, { color: colors.textMuted }]}>
                  {user?.email || 'user@skindiary.com'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: App Settings / Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: colors.textMuted }]}>
            {t('appSettings')}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Dark Mode Row */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <View
                  style={[
                    styles.preferenceIconBubble,
                    { backgroundColor: isDark ? '#2D2824' : '#F6EFEA' },
                  ]}
                >
                  <Text style={styles.preferenceIcon}>{isDark ? '🌙' : '☀️'}</Text>
                </View>
                <View>
                  <Text style={[styles.preferenceTitle, { color: colors.textPrimary }]}>
                    {t('appearance')}
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: colors.textSecondary }]}>
                    {isDark ? t('appearanceSubDark') : t('appearanceSubLight')}
                  </Text>
                </View>
              </View>

              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: isDark ? '#3D3A37' : '#E8E3DC',
                  true: colors.primary,
                }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#3D3A37' : '#E8E3DC'}
              />
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Language Selection Row */}
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLeft}>
                <View
                  style={[
                    styles.preferenceIconBubble,
                    { backgroundColor: isDark ? '#2D2824' : '#F6EFEA' },
                  ]}
                >
                  <Text style={styles.preferenceIcon}>🌐</Text>
                </View>
                <View>
                  <Text style={[styles.preferenceTitle, { color: colors.textPrimary }]}>
                    {t('language')}
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: colors.textSecondary }]}>
                    {t('languageSub')}
                  </Text>
                </View>
              </View>

              {/* Language Flag Selector */}
              <View
                style={[
                  styles.langSegmentGroup,
                  {
                    backgroundColor: isDark ? '#1F1E1B' : '#EFECE6',
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.langSegmentButton,
                    language === 'en' && [
                      styles.langSegmentButtonActive,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.7}
                  accessibilityLabel="English"
                >
                  <Text
                    style={[
                      styles.langSegmentText,
                      {
                        color: language === 'en' ? colors.primary : colors.textMuted,
                        fontWeight: language === 'en' ? '700' : '500',
                      },
                    ]}
                  >
                    🇬🇧 EN
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.langSegmentButton,
                    language === 'tr' && [
                      styles.langSegmentButtonActive,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.primary,
                      },
                    ],
                  ]}
                  onPress={() => setLanguage('tr')}
                  activeOpacity={0.7}
                  accessibilityLabel="Türkçe"
                >
                  <Text
                    style={[
                      styles.langSegmentText,
                      {
                        color: language === 'tr' ? colors.primary : colors.textMuted,
                        fontWeight: language === 'tr' ? '700' : '500',
                      },
                    ]}
                  >
                    🇹🇷 TR
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Section 3: App Information (Brand Rule: Skin Diary remains strictly untranslated) */}
        <View style={styles.infoSection}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Skin Diary</Text>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>
            {t('versionInfo')}
          </Text>
        </View>

        {/* Section 4: Log Out Button */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              {
                backgroundColor: isDark ? '#281C1A' : '#FDF4F2',
                borderColor: isDark ? '#4D2B24' : '#F2CDC5',
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Log out of account"
          >
            <Text style={[styles.logoutButtonText, { color: colors.primary }]}>
              {t('logOut')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Elegant Bottom Sheet for Photo & Avatar Selection */}
      <Modal
        visible={isSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSheetVisible(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setIsSheetVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.bottomSheetContainer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
              },
            ]}
          >
            {/* Sheet Handle Indicator */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            {/* Main Menu: Choose Avatar | Choose from Gallery | Take a Photo */}
            <View style={styles.sheetMenuContent}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {t('editPhoto')}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  {t('editPhotoSub')}
                </Text>

                <View style={styles.sheetOptionsGroup}>
                  {/* Option 1: Take a Photo */}
                  <TouchableOpacity
                    style={[
                      styles.sheetOptionButton,
                      {
                        backgroundColor: isDark ? '#262320' : '#FAF8F5',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    onPress={handleTakePhoto}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.sheetOptionIconCircle,
                        { backgroundColor: isDark ? '#3A2E26' : '#FAF0EC' },
                      ]}
                    >
                      <Text style={styles.sheetOptionEmoji}>📸</Text>
                    </View>
                    <View style={styles.sheetOptionTextContainer}>
                      <Text style={[styles.sheetOptionTitle, { color: colors.textPrimary }]}>
                        {t('takePhoto')}
                      </Text>
                      <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                        {t('takePhotoSub')}
                      </Text>
                    </View>
                    <Text style={[styles.sheetChevron, { color: colors.textMuted }]}>›</Text>
                  </TouchableOpacity>

                  {/* Option 2: Choose from Gallery */}
                  <TouchableOpacity
                    style={[
                      styles.sheetOptionButton,
                      {
                        backgroundColor: isDark ? '#262320' : '#FAF8F5',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    onPress={handleChooseFromGallery}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.sheetOptionIconCircle,
                        { backgroundColor: isDark ? '#263328' : '#EEF5F0' },
                      ]}
                    >
                      <Text style={styles.sheetOptionEmoji}>🖼️</Text>
                    </View>
                    <View style={styles.sheetOptionTextContainer}>
                      <Text style={[styles.sheetOptionTitle, { color: colors.textPrimary }]}>
                        {t('chooseGallery')}
                      </Text>
                      <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                        {t('chooseGallerySub')}
                      </Text>
                    </View>
                    <Text style={[styles.sheetChevron, { color: colors.textMuted }]}>›</Text>
                  </TouchableOpacity>

                  {/* Option 3: Choose Cute Avatar */}
                  <TouchableOpacity
                    style={[
                      styles.sheetOptionButton,
                      {
                        backgroundColor: isDark ? '#262320' : '#FAF8F5',
                        borderColor: colors.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      setIsSheetVisible(false);
                      setIsAvatarPickerVisible(true);
                    }}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.sheetOptionIconCircle,
                        { backgroundColor: isDark ? '#3A2E26' : '#F5EBE6' },
                      ]}
                    >
                      <Text style={styles.sheetOptionEmoji}>✨</Text>
                    </View>
                    <View style={styles.sheetOptionTextContainer}>
                      <Text style={[styles.sheetOptionTitle, { color: colors.textPrimary }]}>
                        {t('chooseAvatar')}
                      </Text>
                      <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                        {t('chooseAvatarSub')}
                      </Text>
                    </View>
                    <Text style={[styles.sheetChevron, { color: colors.textMuted }]}>›</Text>
                  </TouchableOpacity>

                  {/* Option 4: Remove current photo if exists */}
                  {photoUri ? (
                    <TouchableOpacity
                      style={[
                        styles.sheetOptionButton,
                        {
                          backgroundColor: isDark ? '#2D1B18' : '#FDF4F2',
                          borderColor: isDark ? '#4A2722' : '#F5D5CF',
                        },
                      ]}
                      onPress={handleRemovePhoto}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.sheetOptionIconCircle,
                          { backgroundColor: isDark ? '#4A2722' : '#F8E0DC' },
                        ]}
                      >
                        <Text style={styles.sheetOptionEmoji}>✕</Text>
                      </View>
                      <View style={styles.sheetOptionTextContainer}>
                        <Text style={[styles.sheetOptionTitle, { color: colors.primary }]}>
                          {t('removePhoto')}
                        </Text>
                        <Text style={[styles.sheetOptionDesc, { color: colors.textSecondary }]}>
                          {t('removePhotoSubtitle')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={[
                    styles.sheetCancelButton,
                    { backgroundColor: isDark ? '#23211F' : '#EFECE6' },
                  ]}
                  onPress={() => setIsSheetVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetCancelText, { color: colors.textPrimary }]}>
                    {t('cancel')}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Unified Reusable Avatar Picker Modal */}
        <AvatarPickerModal
          visible={isAvatarPickerVisible}
          onClose={() => setIsAvatarPickerVisible(false)}
        />
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  closeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  largeAvatarImage: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  largeAvatarPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatarInitial: {
    fontSize: 28,
    fontWeight: '700',
  },
  largeAvatarEmoji: {
    fontSize: 38,
    textAlign: 'center',
    includeFontPadding: false,
  },
  avatarActionContainer: {
    flex: 1,
    gap: 6,
  },
  editPhotoButton: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  editPhotoText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  removePhotoButton: {
    paddingVertical: 4,
    alignItems: 'center',
  },
  removePhotoText: {
    fontSize: 11,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  unsavedBadge: {
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  nameInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  nameInput: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  saveNameButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveNameButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  readOnlyBox: {
    height: 44,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 13,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  preferenceIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceIcon: {
    fontSize: 18,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  preferenceSubtitle: {
    fontSize: 12,
  },
  langSegmentGroup: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    padding: 3,
    borderWidth: 1,
  },
  langSegmentButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSegmentButtonActive: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  langSegmentText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  infoSection: {
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  appName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 12,
  },
  logoutContainer: {
    marginTop: SPACING.sm,
  },
  logoutButton: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    borderTopWidth: 1,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: SPACING.lg,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetMenuContent: {
    paddingBottom: 4,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  sheetOptionsGroup: {
    gap: 10,
    marginBottom: SPACING.lg,
  },
  sheetOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  sheetOptionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sheetOptionEmoji: {
    fontSize: 20,
  },
  sheetOptionTextContainer: {
    flex: 1,
  },
  sheetOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sheetOptionDesc: {
    fontSize: 11,
  },
  sheetChevron: {
    fontSize: 20,
    fontWeight: '400',
    marginLeft: 8,
  },
  sheetCancelButton: {
    height: 46,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
