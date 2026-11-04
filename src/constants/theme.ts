export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  primary: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  tabBar: string;
  tabBarBorder: string;
  activeTab: string;
  inactiveTab: string;
}

export const LIGHT_COLORS: ThemeColors = {
  background: '#FAF8F5',
  card: '#FFFFFF',
  cardBorder: '#EDE8E1',
  primary: '#C86D56',
  primaryLight: '#FBECE8',
  secondary: '#709775',
  secondaryLight: '#E8F1EB',
  accent: '#E0A96D',
  textPrimary: '#262422',
  textSecondary: '#7A7571',
  textMuted: '#A8A29E',
  border: '#E8E3DC',
  tabBar: '#FFFFFF',
  tabBarBorder: '#EFEAE3',
  activeTab: '#C86D56',
  inactiveTab: '#9C9690',
};

export const DARK_COLORS: ThemeColors = {
  background: '#121212',
  card: '#1E1E1E',
  cardBorder: '#2C2C2C',
  primary: '#E28771',
  primaryLight: '#3A231C',
  secondary: '#85A88A',
  secondaryLight: '#1E2B21',
  accent: '#E8B882',
  textPrimary: '#F5F3EF',
  textSecondary: '#A59F99',
  textMuted: '#716C66',
  border: '#2C2C2C',
  tabBar: '#1A1A1A',
  tabBarBorder: '#282828',
  activeTab: '#E28771',
  inactiveTab: '#7D7771',
};

// Default export for backwards compatibility
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  full: 9999,
};
