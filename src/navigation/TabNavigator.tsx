import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import RoutineScreen from '../screens/RoutineScreen';
import CabinetScreen from '../screens/CabinetScreen';
import DiaryScreen from '../screens/DiaryScreen';
import { RootTabParamList, MainStackParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabIconProps {
  focused: boolean;
  icon: string;
}

const TabIcon = ({ focused, icon }: TabIconProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.iconContainer,
        focused && { backgroundColor: colors.primaryLight },
      ]}
    >
      <Text style={[styles.iconText, focused && styles.iconTextActive]}>{icon}</Text>
    </View>
  );
};

export default function TabNavigator() {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleOpenSettings = () => {
    navigation.navigate('Settings');
  };

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'Z';

  return (
    <Tab.Navigator
      initialRouteName="Routine"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitle: () => (
          <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>
            Skin Diary
          </Text>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={[
              styles.avatarButton,
              {
                backgroundColor: isDark ? '#3A231C' : '#FBECE8',
                borderColor: colors.primary,
              },
            ]}
            activeOpacity={0.7}
            accessibilityLabel="Open settings and profile"
          >
            {user?.photoUri?.startsWith('avatar:') ? (
              <Text style={styles.avatarEmojiText}>
                {user.photoUri.replace('avatar:', '')}
              </Text>
            ) : user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarInitialText, { color: colors.primary }]}>
                {userInitial}
              </Text>
            )}
          </TouchableOpacity>
        ),
        headerRightContainerStyle: {
          paddingRight: 16,
        },
        tabBarActiveTintColor: colors.activeTab,
        tabBarInactiveTintColor: colors.inactiveTab,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.tabBar,
            borderTopColor: colors.tabBarBorder,
          },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="Routine"
        component={RoutineScreen}
        options={{
          tabBarLabel: t('tabRoutine'),
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="☀️" />,
        }}
      />
      <Tab.Screen
        name="Cabinet"
        component={CabinetScreen}
        options={{
          tabBarLabel: t('tabCabinet'),
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🧴" />,
        }}
      />
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{
          tabBarLabel: t('tabDiary'),
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✨" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerTitleText: {
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: 1.0,
  },
  tabBar: {
    borderTopWidth: 1,
    height: 70,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  iconText: {
    fontSize: 16,
    opacity: 0.6,
  },
  iconTextActive: {
    opacity: 1,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitialText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  avatarEmojiText: {
    fontSize: 16,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
