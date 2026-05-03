import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";
import LottieView from "lottie-react-native";

/**
 * Index Route - Smart Initial Navigation
 * Checks for existing session and redirects appropriately:
 * - If logged in → Home screen (no splash)
 * - If not logged in → Splash screen
 */
export default function Index() {
  const { user, loading, profile } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  if (!isReady || loading) {
    return (
      <View style={styles.container}>
        {Platform.OS === 'web' ? (
            <ActivityIndicator size="large" color={colors.primary} />
        ) : (
            <LottieView
                source={require('../assets/animations/logo.json')}
                autoPlay
                loop
                style={{ width: 150, height: 150 }}
            />
        )}
      </View>
    );
  }

  // Always route through splash for the Lottie logo animation
  return <Redirect href="/splash" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
