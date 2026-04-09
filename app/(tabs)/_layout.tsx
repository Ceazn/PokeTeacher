import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

function TabIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={22} {...props} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:           false,
        tabBarStyle: {
          backgroundColor: '#1A1A2E',
          borderTopColor:  '#0F3460',
          borderTopWidth:  1,
          height:          Platform.OS === 'ios' ? 84 : 60,
          paddingBottom:   Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarActiveTintColor:   '#E8243C',
        tabBarInactiveTintColor: '#4A6A80',
        tabBarLabelStyle: {
          fontSize:   11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:    'Build',
          tabBarIcon: ({ color }) => <TabIcon name="plus-circle" color={color} />,
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title:    'Teams',
          tabBarIcon: ({ color }) => <TabIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title:    'Settings',
          tabBarIcon: ({ color }) => <TabIcon name="cog" color={color} />,
        }}
      />
    </Tabs>
  );
}
