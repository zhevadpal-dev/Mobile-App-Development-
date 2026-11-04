import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../constants/translations';
import ThemeToggle from '../components/ThemeToggle';
import { SPACING, RADIUS } from '../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: string;
  stepEyebrow: string;
  titleKey: TranslationKey;
  subtitleKey: TranslationKey;
  iconName: keyof typeof Ionicons.glyphMap;
  accentColor: 'terracotta' | 'sage';
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'cabinet',
    stepEyebrow: 'RITUAL 01 / 03',
    titleKey: 'onboarding1Title',
    subtitleKey: 'onboarding1Subtitle',
    iconName: 'layers-outline',
    accentColor: 'terracotta',
  },
  {
    id: 'routine',
    stepEyebrow: 'RITUAL 02 / 03',
    titleKey: 'onboarding2Title',
    subtitleKey: 'onboarding2Subtitle',
    iconName: 'checkmark-done-circle-outline',
    accentColor: 'sage',
  },
  {
    id: 'diary',
    stepEyebrow: 'RITUAL 03 / 03',
    titleKey: 'onboarding3Title',
    subtitleKey: 'onboarding3Subtitle',
    iconName: 'sparkles-outline',
    accentColor: 'terracotta',
  },
];

export default function OnboardingScreen({ navigation }: Props) {
  // Guarantee exact device screen width matching Dimensions.get('window').width
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = windowWidth > 0 ? windowWidth : Dimensions.get('window').width;

  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(scrollOffset / screenWidth);
    if (pageIndex !== currentIndex && pageIndex >= 0 && pageIndex < SLIDES.length) {
      setCurrentIndex(pageIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * screenWidth,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];
  const activeColor = isDark
    ? currentSlide.accentColor === 'sage'
      ? '#A8D5AD'
      : '#F2A796'
    : currentSlide.accentColor === 'sage'
    ? colors.secondary
    : colors.primary;

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    const isSage = item.accentColor === 'sage';

    // Explicit high-contrast icon color (soft cream #FAF8F5 or sage #A8D5AD in dark mode)
    const iconColor = isDark
      ? isSage
        ? '#A8D5AD'
        : '#FAF8F5'
      : isSage
      ? colors.secondary
      : colors.primary;

    const badgeBg = isDark
      ? isSage
        ? '#1D2A20'
        : '#2C211D'
      : isSage
      ? colors.secondaryLight
      : colors.primaryLight;

    const ringBorder = isDark
      ? isSage
        ? '#334D38'
        : '#56342B'
      : isSage
      ? '#CFE3D5'
      : '#F4D4CC';

    // Explicit high-contrast readable text colors for dark & light backgrounds
    const titleColor = isDark ? '#FFFFFF' : colors.textPrimary;
    const subtitleColor = isDark ? '#EAE6E1' : colors.textSecondary;
    const eyebrowColor = isDark
      ? isSage
        ? '#A8D5AD'
        : '#F2A796'
      : isSage
      ? '#5C8561'
      : colors.primary;

    return (
      <View style={[styles.slideContainer, { width: screenWidth }]}>
        {/* Medallion Icon Display with Perfect Centering */}
        <View style={styles.medallionWrapper}>
          <View style={[styles.outerRing, { borderColor: ringBorder }]}>
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: badgeBg,
                  borderColor: isDark ? '#3D332D' : '#EDE8E0',
                },
              ]}
            >
              <Ionicons name={item.iconName} size={64} color={iconColor} />
            </View>
          </View>
        </View>

        {/* Text Details with Guaranteed Contrast */}
        <View style={styles.textContent}>
          <Text style={[styles.stepEyebrow, { color: eyebrowColor }]}>
            {item.stepEyebrow}
          </Text>

          <Text style={[styles.slideTitle, { color: titleColor }]}>
            {t(item.titleKey)}
          </Text>

          <Text style={[styles.slideSubtitle, { color: subtitleColor }]}>
            {t(item.subtitleKey)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Top Header with Theme Toggle & Skip Button */}
      <View style={styles.topBar}>
        <ThemeToggle />

        {!isLastSlide ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            accessibilityLabel="Skip onboarding"
          >
            <Text
              style={[
                styles.skipButtonText,
                { color: isDark ? '#D6D1CA' : colors.textSecondary },
              ]}
            >
              {t('onboardingSkip')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Swipable Carousel with Pixel-Exact Layout */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={screenWidth}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        style={styles.flatList}
        contentContainerStyle={styles.flatListContent}
      />

      {/* Bottom Area: Pagination Dots & Action Buttons */}
      <View style={styles.bottomSection}>
        {/* Minimalist Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const dotColor = isDark
              ? slide.accentColor === 'sage'
                ? '#A8D5AD'
                : '#F2A796'
              : slide.accentColor === 'sage'
              ? colors.secondary
              : colors.primary;

            return (
              <TouchableOpacity
                key={slide.id}
                onPress={() => {
                  flatListRef.current?.scrollToOffset({
                    offset: idx * screenWidth,
                    animated: true,
                  });
                  setCurrentIndex(idx);
                }}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                accessibilityLabel={`Go to slide ${idx + 1}`}
              >
                <View
                  style={[
                    styles.paginationDot,
                    isActive
                      ? [styles.paginationDotActive, { backgroundColor: dotColor }]
                      : {
                          backgroundColor: isDark ? '#3D3833' : '#E5DFD7',
                        },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          {isLastSlide ? (
            <TouchableOpacity
              style={[
                styles.getStartedButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
              accessibilityLabel="Get Started with Skin Diary"
            >
              <Text style={styles.getStartedButtonText}>
                {t('onboardingGetStarted')}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color="#FFFFFF"
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.nextRow}>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  {
                    backgroundColor: isDark ? '#26221F' : '#FAF6F0',
                    borderColor: isDark ? '#423B34' : '#E8E1D5',
                  },
                ]}
                onPress={handleNext}
                activeOpacity={0.8}
                accessibilityLabel="Next slide"
              >
                <Text style={[styles.nextButtonText, { color: activeColor }]}>
                  {t('onboardingNext')}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={activeColor}
                  style={styles.buttonIcon}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
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
    paddingTop: Platform.OS === 'android' ? SPACING.md : SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  skipPlaceholder: {
    width: 50,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    height: '100%',
  },
  // Item container: fixed to exact screen width, no horizontal flex shrink/grow conflicts
  slideContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  medallionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  outerRing: {
    width: 154,
    height: 154,
    borderRadius: 77,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  stepEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: SPACING.sm + 4,
  },
  slideSubtitle: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
    textAlign: 'center',
    maxWidth: 320,
  },
  bottomSection: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? SPACING.lg : SPACING.xl,
    paddingTop: SPACING.sm,
    gap: SPACING.lg,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 24,
    height: 6,
    borderRadius: 3,
  },
  actionContainer: {
    width: '100%',
    minHeight: 52,
    justifyContent: 'center',
  },
  getStartedButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    paddingHorizontal: SPACING.lg,
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextRow: {
    alignItems: 'center',
  },
  nextButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl + 4,
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
