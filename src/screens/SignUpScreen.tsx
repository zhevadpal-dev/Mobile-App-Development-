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
import ThemeToggle from '../components/ThemeToggle';
import { SPACING, RADIUS } from '../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const { colors, isDark } = useTheme();
  const { signUp } = useAuth();

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
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
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
      setErrorMessage(error?.message || 'Could not complete registration. Please try again.');
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
          {/* Top Bar with Back Button & Theme Toggle */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={[
                styles.backButton,
                { borderColor: isDark ? '#33302B' : '#E8E3DC' },
              ]}
              activeOpacity={0.7}
              accessibilityLabel="Back to sign in"
            >
              <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>← Back</Text>
            </TouchableOpacity>
            <ThemeToggle />
          </View>

          {/* Hero Branding */}
          <View style={styles.heroSection}>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
              Begin your personalized, mindful skin ritual
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
            {/* Name Field (Personalization) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>YOUR NAME</Text>
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
                placeholder="e.g. Zeynep"
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMAIL ADDRESS</Text>
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
                placeholder="name@example.com"
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
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PASSWORD</Text>
                <Text style={[styles.hintText, { color: colors.textMuted }]}>min. 6 characters</Text>
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
                  placeholder="••••••••"
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
                    {showPassword ? 'Hide' : 'Show'}
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
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Navigation to Sign In */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setErrorMessage(null);
                navigation.navigate('Login');
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
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
    paddingBottom: SPACING.xl,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
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
    marginBottom: SPACING.xl,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 1.5,
    marginBottom: 8,
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
    gap: SPACING.md,
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
    height: 50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    fontSize: 14,
  },
  passwordInputContainer: {
    height: 50,
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
    height: 50,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  footerText: {
    fontSize: 13,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});
