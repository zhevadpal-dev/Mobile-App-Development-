import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RoutineScreen from '../screens/RoutineScreen';
import CabinetScreen from '../screens/CabinetScreen';
import DiaryScreen from '../screens/DiaryScreen';
import { RootTabParamList } from '../types/navigation';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

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
  const { colors } = useTheme();

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
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitleText, { color: colors.textPrimary }]}>
              Skin Diary
            </Text>
            <Text style={styles.headerSubtitleText}>🧴✨</Text>
          </View>
        ),
        headerRight: () => <ThemeToggle />,
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
          tabBarLabel: 'Routine',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="☀️" />,
        }}
      />
      <Tab.Screen
        name="Cabinet"
        component={CabinetScreen}
        options={{
          tabBarLabel: 'Cabinet',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🧴" />,
        }}
      />
      <Tab.Screen
        name="Diary"
        component={DiaryScreen}
        options={{
          tabBarLabel: 'Diary',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✨" />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: 16,
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
});
