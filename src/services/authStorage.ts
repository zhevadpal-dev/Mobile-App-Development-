import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  StoredUserAccount,
  AuthSession,
  LoginCredentials,
  SignUpCredentials,
} from '../types/auth';

const AUTH_TOKEN_KEY = '@skin_diary_auth_token';
const AUTH_USER_KEY = '@skin_diary_auth_user';
const MOCK_ACCOUNTS_KEY = '@skin_diary_mock_accounts';

/**
 * Pre-seeded demo user account for fast testing
 */
const DEFAULT_DEMO_ACCOUNT: StoredUserAccount = {
  id: 'usr_demo_101',
  name: 'Zeynep Naz',
  email: 'zeynep@skindiary.com',
  password: 'password123',
  createdAt: 1714800000000,
};

/**
 * Fetch all registered mock accounts
 */
const getMockAccounts = async (): Promise<StoredUserAccount[]> => {
  try {
    const raw = await AsyncStorage.getItem(MOCK_ACCOUNTS_KEY);
    if (!raw) {
      // Seed initial demo account if empty
      const initial = [DEFAULT_DEMO_ACCOUNT];
      await AsyncStorage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify(initial));
      return initial;
    }
    const accounts: StoredUserAccount[] = JSON.parse(raw);
    return Array.isArray(accounts) ? accounts : [DEFAULT_DEMO_ACCOUNT];
  } catch (error) {
    console.error('Error fetching mock accounts:', error);
    return [DEFAULT_DEMO_ACCOUNT];
  }
};

/**
 * Save updated accounts list
 */
const saveMockAccounts = async (accounts: StoredUserAccount[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(MOCK_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error('Error saving mock accounts:', error);
  }
};

/**
 * Retrieve current active session from AsyncStorage (token + user)
 */
export const getStoredSession = async (): Promise<AuthSession | null> => {
  try {
    const [token, userRaw] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(AUTH_USER_KEY),
    ]);

    if (!token || !userRaw) {
      return null;
    }

    const user: User = JSON.parse(userRaw);
    return { token, user };
  } catch (error) {
    console.error('Error reading stored session:', error);
    return null;
  }
};

/**
 * Log in with email and password
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthSession> => {
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  if (!normalizedEmail) {
    throw new Error('Please enter your email address.');
  }

  if (!password) {
    throw new Error('Please enter your password.');
  }

  const accounts = await getMockAccounts();
  const account = accounts.find(a => a.email.toLowerCase() === normalizedEmail);

  if (!account) {
    throw new Error('No account found with this email address.');
  }

  if (account.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const token = `skn_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const user: User = {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: account.createdAt,
  };

  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
  ]);

  return { token, user };
};

/**
 * Register a new user with Name, Email, and Password
 */
export const signUpUser = async (credentials: SignUpCredentials): Promise<AuthSession> => {
  const name = credentials.name.trim();
  const normalizedEmail = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  if (!name) {
    throw new Error('Please enter your name.');
  }

  if (!normalizedEmail) {
    throw new Error('Please enter a valid email address.');
  }

  if (!normalizedEmail.includes('@') || !normalizedEmail.includes('.')) {
    throw new Error('Please provide a valid email format.');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const accounts = await getMockAccounts();
  const existing = accounts.find(a => a.email.toLowerCase() === normalizedEmail);

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const newAccount: StoredUserAccount = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    email: normalizedEmail,
    password,
    createdAt: Date.now(),
  };

  const updatedAccounts = [...accounts, newAccount];
  await saveMockAccounts(updatedAccounts);

  const token = `skn_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const user: User = {
    id: newAccount.id,
    name: newAccount.name,
    email: newAccount.email,
    createdAt: newAccount.createdAt,
  };

  await Promise.all([
    AsyncStorage.setItem(AUTH_TOKEN_KEY, token),
    AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user)),
  ]);

  return { token, user };
};

/**
 * Log out user by clearing stored token and session details
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  } catch (error) {
    console.error('Error logging out from AsyncStorage:', error);
  }
};
