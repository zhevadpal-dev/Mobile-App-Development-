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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import ThemeToggle from '../components/ThemeToggle';
import { SPACING, RADIUS } from '../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { login } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage(t('errorEnterEmail'));
      return;
    }
    if (!password) {
      setErrorMessage(t('errorEnterPassword'));
      return;
    }

    try {
      setIsSubmitting(true);
      await login({ email, password });
    } catch (error: any) {
      setErrorMessage(error?.message || t('errorLoginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('zeynep@skindiary.com');
    setPassword('password123');
    setErrorMessage(null);
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
            {/* Top Bar with Theme Toggle */}
            <View style={styles.topBar}>
              <View style={styles.topBarSpacer} />
              <ThemeToggle />
            </View>

            {/* Hero Branding */}
            <View style={styles.heroSection}>
              <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Skin Diary</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                {t('signInSubtitle')}
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

            {/* Form Inputs */}
            <View style={styles.formContainer}>
              {/* Email Field */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('email')}</Text>
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
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{t('password')}</Text>
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

              {/* Sign In CTA Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                  isSubmitting && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{t('signIn')}</Text>
                )}
              </TouchableOpacity>

              {/* Quick Demo Credentials Fill */}
              <TouchableOpacity
                style={[
                  styles.demoButton,
                  {
                    borderColor: isDark ? '#3D3631' : '#E8E3DC',
                    backgroundColor: isDark ? '#1C1A18' : '#FAF6F0',
                  },
                ]}
                onPress={handleQuickDemoFill}
                activeOpacity={0.7}
              >
                <Text style={[styles.demoButtonText, { color: colors.secondary }]}>
                  {t('quickDemo')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Minimalist Bottom Navigation to SignUp */}
          <View style={styles.footerSection}>
            <TouchableOpacity
              style={styles.switchAuthButton}
              onPress={() => {
                setErrorMessage(null);
                navigation.navigate('SignUp');
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
            >
              <Text style={[styles.switchAuthText, { color: colors.textSecondary }]}>
                {t('dontHaveAccount')}{' '}
                <Text style={[styles.switchAuthLink, { color: colors.primary }]}>{t('signUp')}</Text>
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
  topBarSpacer: {
    width: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 2,
    marginBottom: 6,
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
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
  demoButton: {
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
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
