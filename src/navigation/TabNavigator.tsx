import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import RoutineScreen from '../screens/RoutineScreen';
import CabinetScreen from '../screens/CabinetScreen';
import DiaryScreen from '../screens/DiaryScreen';
import { RootTabParamList } from '../types/navigation';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

interface TabIconProps {
  focused: boolean;
  icon: string;
}

const TabIcon = ({ focused, icon }: TabIconProps) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Text style={[styles.iconText, focused && styles.iconTextActive]}>{icon}</Text>
  </View>
);

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Routine"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.activeTab,
        tabBarInactiveTintColor: COLORS.inactiveTab,
        tabBarStyle: styles.tabBar,
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
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopColor: COLORS.tabBarBorder,
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
  iconContainerActive: {
    backgroundColor: COLORS.primaryLight,
  },
  iconText: {
    fontSize: 16,
    opacity: 0.6,
  },
  iconTextActive: {
    opacity: 1,
  },
});
