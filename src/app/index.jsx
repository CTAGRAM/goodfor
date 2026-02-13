import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { colors } from "@/constants/theme";

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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (user && profile) {
    // AuthContext handles the redirect in its useEffect, 
    // but providing a fallback here is good practice.
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/onboarding/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
