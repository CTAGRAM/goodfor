import { Tabs, useRouter } from "expo-router";
import { View, Pressable, StyleSheet } from "react-native";
import { Home, History, QrCode, MessageCircle, Settings } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    return (
        <View style={{ flex: 1 }}>
        <Tabs
            screenListeners={{
                tabPress: (e) => {
                    // Different haptic for scan button vs regular tabs
                    if (e.target?.startsWith('scan')) {
                        hapticMedium();
                    } else {
                        hapticLight();
                    }
                },
            }}
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.mutedForeground,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 60 + insets.bottom,
                    backgroundColor: colors.card,
                    borderRadius: 0,
                    paddingBottom: insets.bottom + 8,
                    paddingTop: 8,
                    paddingHorizontal: 0,
                    borderTopWidth: 1,
                    borderTopColor: `${colors.border}40`,
                    borderWidth: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 4,
                },
                tabBarItemStyle: {
                    paddingVertical: 0,
                    height: 52,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                    fontFamily: 'Rubik_500Medium',
                    marginTop: 2,
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
                                width: 52,
                                height: 52,
                                borderRadius: 26,
                                backgroundColor: colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginTop: -8,
                                shadowColor: colors.primary,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 6,
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
                    title: 'Ask',
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
            {/* Hide recipes tab — it's accessible via home card instead */}
            <Tabs.Screen
                name="recipes"
                options={{
                    href: null,
                }}
            />
        </Tabs>
        </View>
    );
}

