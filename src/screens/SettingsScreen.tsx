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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SPACING, RADIUS } from '../constants/theme';

// Curated aesthetic skincare mock avatars for uploading/mocking profile pictures
const MOCK_PHOTO_PRESETS = [
  {
    id: 'avatar_1',
    label: 'Dewy Glow',
    uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar_2',
    label: 'Fresh Radiance',
    uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar_3',
    label: 'Pure Botanical',
    uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'avatar_4',
    label: 'Natural Minimal',
    uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  },
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(user?.photoUri);
  const [isPhotoModalVisible, setIsPhotoModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
      Alert.alert('Invalid Name', 'Name cannot be empty.');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ name: name.trim() });
      setHasUnsavedNameChange(false);
      Alert.alert('Saved ✨', 'Your profile name has been updated.');
    } catch (error) {
      console.error('Error updating name:', error);
      Alert.alert('Error', 'Could not save profile name.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPhoto = async (newUri: string) => {
    try {
      setIsPhotoModalVisible(false);
      setPhotoUri(newUri);
      await updateProfile({ photoUri: newUri });
      Alert.alert('Photo Updated ✨', 'Your profile photo is now updated across the app.');
    } catch (error) {
      console.error('Error updating photo:', error);
      Alert.alert('Error', 'Could not save profile photo.');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setIsPhotoModalVisible(false);
      setPhotoUri(undefined);
      await updateProfile({ photoUri: null });
      Alert.alert('Photo Removed', 'Your profile photo has been reset to your initials.');
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Skin Diary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const userInitial = (name || user?.name || 'U').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Settings Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Settings</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeButton, { backgroundColor: isDark ? '#23211F' : '#EFECE6' }]}
          activeOpacity={0.7}
          accessibilityLabel="Close settings"
        >
          <Text style={[styles.closeButtonText, { color: colors.textPrimary }]}>✕ Done</Text>
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
            PROFILE MANAGEMENT
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
              <View style={styles.avatarWrapper}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.largeAvatarImage} />
                ) : (
                  <View
                    style={[
                      styles.largeAvatarPlaceholder,
                      { backgroundColor: isDark ? '#3A231C' : '#FBECE8' },
                    ]}
                  >
                    <Text style={[styles.largeAvatarInitial, { color: colors.primary }]}>
                      {userInitial}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.cameraBadge, { backgroundColor: colors.primary }]}
                  onPress={() => setIsPhotoModalVisible(true)}
                  activeOpacity={0.8}
                  accessibilityLabel="Upload profile photo"
                >
                  <Text style={styles.cameraBadgeIcon}>📷</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.avatarActionContainer}>
                <TouchableOpacity
                  style={[
                    styles.uploadPhotoButton,
                    {
                      borderColor: colors.primary,
                      backgroundColor: isDark ? '#38251E' : '#FBF0EC',
                    },
                  ]}
                  onPress={() => setIsPhotoModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.uploadPhotoText, { color: colors.primary }]}>
                    {photoUri ? 'Change Profile Photo' : 'Upload Profile Photo'}
                  </Text>
                </TouchableOpacity>

                {photoUri ? (
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={handleRemovePhoto}
                    activeOpacity={0.6}
                  >
                    <Text style={[styles.removePhotoText, { color: colors.textMuted }]}>
                      Remove Photo
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
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NAME</Text>
                {hasUnsavedNameChange ? (
                  <Text style={[styles.unsavedBadge, { color: colors.primary }]}>Unsaved</Text>
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
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textMuted}
                  maxLength={40}
                  autoCapitalize="words"
                />
                {hasUnsavedNameChange ? (
                  <TouchableOpacity
                    style={[styles.saveNameButton, { backgroundColor: colors.primary }]}
                    onPress={handleSaveName}
                    disabled={isSaving}
                    activeOpacity={0.8}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.saveNameButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Email (Read-Only) */}
            <View style={[styles.inputGroup, { marginTop: 12 }]}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL</Text>
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
            APP SETTINGS
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
                    Dark Mode
                  </Text>
                  <Text style={[styles.preferenceSubtitle, { color: colors.textSecondary }]}>
                    {isDark ? 'Dark theme active' : 'Light cream theme active'}
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
          </View>
        </View>

        {/* Section 3: App Information */}
        <View style={styles.infoSection}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>Skin Diary</Text>
          <Text style={[styles.appVersion, { color: colors.textMuted }]}>
            Version 1.0.0 • Mindful Skincare Rituals
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
              Log Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Profile Photo Preset Modal */}
      <Modal
        visible={isPhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoModalVisible(false)}
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
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Select Profile Photo
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose an aesthetic portrait to represent your skin diary profile
            </Text>

            <View style={styles.presetGrid}>
              {MOCK_PHOTO_PRESETS.map(preset => (
                <TouchableOpacity
                  key={preset.id}
                  style={[
                    styles.presetItem,
                    photoUri === preset.uri && { borderColor: colors.primary, borderWidth: 2 },
                  ]}
                  onPress={() => handleSelectPhoto(preset.uri)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: preset.uri }} style={styles.presetImage} />
                  <Text style={[styles.presetLabel, { color: colors.textPrimary }]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.modalCancelButton,
                { backgroundColor: isDark ? '#23211F' : '#EFECE6' },
              ]}
              onPress={() => setIsPhotoModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Cancel</Text>
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
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cameraBadgeIcon: {
    fontSize: 12,
  },
  avatarActionContainer: {
    flex: 1,
    gap: 6,
  },
  uploadPhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  uploadPhotoText: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: SPACING.lg,
  },
  presetItem: {
    width: '47%',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 6,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalCancelButton: {
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
