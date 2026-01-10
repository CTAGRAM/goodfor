import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, History, QrCode, MessageCircle, Settings } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: insets.bottom + 8,
                    left: 16,
                    right: 16,
                    height: 64,
                    backgroundColor: colors.card,
                    borderRadius: 32,
                    paddingBottom: 12,
                    paddingTop: 12,
                    paddingHorizontal: 16,
                    borderTopWidth: 0,
                    borderWidth: 1,
                    borderColor: `${colors.border}80`,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                },
                tabBarItemStyle: {
                    paddingVertical: 0,
                    height: 64,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    fontFamily: 'Rubik_500Medium',
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginTop: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Home
                            size={24}
                            color={color}
                            fill={focused ? color : 'none'}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, focused }) => (
                        <History
                            size={24}
                            color={color}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="scan"
                options={{
                    title: '',
                    tabBarIcon: ({ focused }) => (
                        <View
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 4,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 8,
                            }}
                        >
                            <QrCode size={24} color={colors.primaryForeground} strokeWidth={2} />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="ai"
                options={{
                    title: 'AI',
                    tabBarIcon: ({ color, focused }) => (
                        <MessageCircle
                            size={24}
                            color={color}
                            fill={focused ? color : 'none'}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <Settings
                            size={24}
                            color={color}
                            strokeWidth={focused ? 2.5 : 2}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
