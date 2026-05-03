import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Rubik_400Regular,
  Rubik_500Medium,
  Rubik_600SemiBold,
  Rubik_700Bold,
  Rubik_800ExtraBold,
} from "@expo-google-fonts/rubik";
import { AuthProvider } from "@/contexts/AuthContext";
import { RevenueCatProvider } from "@/contexts/RevenueCatContext";
import { AlertProvider } from "@/contexts/AlertContext";
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from '@/lib/posthog';
import { setupNotifications } from '@/lib/notificationService';
import { CrashBoundary } from '@/components/CrashBoundary';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Rubik_400Regular,
    Rubik_500Medium,
    Rubik_600SemiBold,
    Rubik_700Bold,
    Rubik_800ExtraBold,
  });

  useEffect(() => {
    setupNotifications();
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // AuthProvider is outside so RevenueCatProvider can access auth state
  // AlertProvider wraps everything to provide premium custom alerts everywhere
  return (
    <CrashBoundary>
      <PostHogProvider client={posthog}>
      <AuthProvider>
        <RevenueCatProvider>
          <AlertProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                <Stack.Screen name="index" />
                <Stack.Screen name="splash" />
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
                <Stack.Screen name="auth/callback" />
                <Stack.Screen name="(tabs)" />
              </Stack>
            </GestureHandlerRootView>
          </AlertProvider>
        </RevenueCatProvider>
      </AuthProvider>
      </PostHogProvider>
    </CrashBoundary>
  );
}
