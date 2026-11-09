import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* Home Screen Header                                      */}
        {/* Top Left: Dynamic Time-based Greeting                   */}
        {/* Top Right: Balanced Minimalist Profile Avatar            */}
        {/* ======================================================== */}
        <View style={styles.header}>
          {/* Top Left: Dynamic Greeting */}
          <View style={styles.greetingContainer}>
            <View style={styles.eyebrowRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.eyebrow, { color: colors.secondary }]}>
                {t('dailyRitualEyebrow')}
              </Text>
            </View>
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
        {/* Agile Step Scaffold: Welcome & Quick Ritual Card        */}
        {/* ======================================================== */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  container: {
    width: '100%',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  /* Header Layout */
  header: {
    width: '100%',
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  greetingContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    textTransform: 'uppercase',
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
  /* Hero Card for Agile Scaffold */
  heroCard: {
    width: '92%',
    alignSelf: 'center',
    marginHorizontal: 'auto',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: SPACING.lg,
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
