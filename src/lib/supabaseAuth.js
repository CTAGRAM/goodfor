import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

// Supabase client for direct auth (email/password)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
};

// Sign up with email - sends OTP code (not magic link)
export const signUpWithEmail = async (email, password, metadata = {}) => {
    // First create the user with password
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
            // This tells Supabase to NOT auto-confirm
            emailRedirectTo: undefined,
        },
    });

    if (error) throw error;
    return data;
};

// Send OTP code to email (for passwordless or verification)
export const sendOtpToEmail = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            // This forces OTP code instead of magic link
            shouldCreateUser: false,
        },
    });

    if (error) throw error;
    return data;
};

// Verify OTP code
export const verifyOtp = async (email, token, type = 'email') => {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: type, // 'email' for OTP verification, 'signup' for signup verification
    });

    if (error) throw error;
    return data;
};

// Resend OTP for signup
export const resendSignupOtp = async (email) => {
    const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email,
    });

    if (error) throw error;
    return data;
};

// Sign out
export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

// Get current user
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

// Get session
export const getSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
};

// Google OAuth imports
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
    try {
        // Create redirect URI
        const redirectUrl = AuthSession.makeRedirectUri({
            scheme: 'goodfor',
            path: 'auth/callback',
        });

        // Initiate OAuth flow with Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: false,
            },
        });

        if (error) throw error;

        // Open browser for OAuth
        const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl
        );

        if (result.type === 'success') {
            const { url } = result;

            // Extract tokens from URL
            const hashParams = url.split('#')[1];
            if (!hashParams) throw new Error('No auth response');

            const params = new URLSearchParams(hashParams);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            if (!access_token) throw new Error('No access token');

            // Set session with tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });

            if (sessionError) throw sessionError;
            return { session: sessionData.session, error: null };
        }

        return { session: null, error: new Error('OAuth cancelled or failed') };
    } catch (error) {
        console.error('Google OAuth error:', error);
        return { session: null, error };
    }
};
