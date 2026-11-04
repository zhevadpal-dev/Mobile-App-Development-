import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import { SPACING, RADIUS } from '../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'password' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignUp = async () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage(t('errorEnterName'));
      return;
    }
    if (!email.trim()) {
      setErrorMessage(t('errorEnterEmail'));
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage(t('errorPasswordMin'));
      return;
    }

    try {
      setIsSubmitting(true);
      await signUp({
        name: name.trim(),
        email: email.trim(),
        password,
      });
    } catch (error: any) {
      setErrorMessage(error?.message || t('errorSignUpFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Content Area */}
          <View style={styles.mainContent}>
            {/* Top Bar with Back Button & Theme Toggle */}
            <View style={styles.topBar}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={[
                  styles.backButton,
                  { borderColor: isDark ? '#33302B' : '#E8E3DC' },
                ]}
                activeOpacity={0.7}
                accessibilityLabel="Back to log in"
              >
                <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>← {t('back')}</Text>
              </TouchableOpacity>
              <ThemeToggle />
            </View>

            {/* Hero Branding with Lotus Asset */}
            <View style={styles.heroSection}>
              <View
                style={[
                  styles.logoContainer,
                  {
                    shadowColor: isDark ? '#000000' : '#262422',
                  },
                ]}
              >
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                  accessibilityLabel="Skin Diary Lotus Logo"
                />
              </View>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>{t('createAccount')}</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {t('signUpSubtitle')}
              </Text>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: isDark ? '#38221D' : '#FBECE8',
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: colors.primary }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields: Name, Email, Password */}
            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('yourName')}</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        focusedField === 'name' ? colors.primary : colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t('namePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={name}
                  onChangeText={text => {
                    setName(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>

              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('emailAddress')}</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        focusedField === 'email' ? colors.primary : colors.cardBorder,
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder={t('emailPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={text => {
                    setEmail(text);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('password')}</Text>
                  <Text style={[styles.hintText, { color: colors.textMuted }]}>{t('minCharacters')}</Text>
                </View>
                <View
                  style={[
                    styles.passwordInputContainer,
                    {
                      backgroundColor: colors.card,
                      borderColor:
                        focusedField === 'password' ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.passwordTextInput, { color: colors.textPrimary }]}
                    placeholder={t('passwordPlaceholder')}
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={text => {
                      setPassword(text);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(prev => !prev)}
                    activeOpacity={0.6}
                    accessibilityLabel="Toggle password visibility"
                  >
                    <Text style={[styles.eyeText, { color: colors.textMuted }]}>
                      {showPassword ? t('hide') : t('show')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('createAccount')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Minimalist Bottom Navigation to Log In */}
          <View style={styles.footerSection}>
            <TouchableOpacity
              style={styles.switchAuthButton}
              onPress={() => {
                setErrorMessage(null);
                navigation.navigate('Login');
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            >
              <Text style={[styles.switchAuthText, { color: colors.textSecondary }]}>
                {t('alreadyHaveAccount')}{' '}
                <Text style={[styles.switchAuthLink, { color: colors.primary }]}>{t('logIn')}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.lg,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.md,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 20,
    marginBottom: SPACING.xs,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
  brandLogo: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  errorBanner: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  hintText: {
    fontSize: 11,
  },
  textInput: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  passwordInputContainer: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eyeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    height: 48,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#C86D56',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  footerSection: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  switchAuthButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  switchAuthText: {
    fontSize: 13,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  switchAuthLink: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
