import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseAuth';
import { colors, fonts, spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

/**
 * OAuth Callback Handler
 * 
 * This page shows while OAuth callback is being processed by AuthContext.
 * Navigation happens automatically via AuthContext's navigation effect
 * when both user and profile are loaded.
 */
export default function AuthCallback() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [status, setStatus] = useState('Completing sign in...');
    const [waitTime, setWaitTime] = useState(0);

    // Track how long we've been waiting
    useEffect(() => {
        const interval = setInterval(() => {
            setWaitTime(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Update status based on auth state
    useEffect(() => {
        console.log('[AuthCallback] Auth state:', {
            hasUser: !!user,
            hasProfile: !!profile,
            loading,
            waitTime
        });

        if (user && profile) {
            setStatus('Welcome back!');
            // Navigation will happen via AuthContext's navigation effect
        } else if (user && !profile && !loading) {
            setStatus('Setting up your profile...');
        } else if (loading) {
            setStatus('Completing sign in...');
        }
    }, [user, profile, loading, waitTime]);

    // Timeout fallback - if stuck for 8+ seconds, force navigation
    useEffect(() => {
        if (waitTime >= 8) {
            console.log('[AuthCallback] Timeout - checking state and forcing navigation');

            if (user) {
                // User exists, navigate to home (profile will load there)
                console.log('[AuthCallback] User exists, navigating to home');
                router.replace('/(tabs)/home');
            } else {
                // No user after 8 seconds, go back to sign-in
                console.log('[AuthCallback] No user after timeout, going to sign-in');
                router.replace('/sign-in');
            }
        }
    }, [waitTime, user, router]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.text}>{status}</Text>
            {waitTime > 3 && (
                <Text style={styles.subtext}>This is taking longer than expected...</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[4],
    },
    text: {
        fontSize: 16,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
    },
    subtext: {
        fontSize: 12,
        fontFamily: fonts.sans.regular,
        color: colors.mutedForeground,
        marginTop: spacing[2],
    },
});
