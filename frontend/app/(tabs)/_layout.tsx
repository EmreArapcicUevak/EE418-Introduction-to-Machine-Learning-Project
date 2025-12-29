import { Tabs } from "expo-router";
import { TabBarIcon } from "../../components/TabBarIcon";
import { Colors } from "../../constants/theme";
import { useColorScheme } from "../../hooks/use-color-scheme";
import { PredictionHistoryProvider } from "../../hooks/use-prediction-history";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <PredictionHistoryProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarStyle: {
            height: 65,
            paddingBottom: 10,
            paddingTop: 5,
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Predict",
            tabBarIcon: ({ color }) => <TabBarIcon name="calculator" color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color }) => <TabBarIcon name="time-outline" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: "Stats",
            tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <TabBarIcon name="person-outline" color={color} />,
          }}
        />
      </Tabs>
    </PredictionHistoryProvider>
  );
}
