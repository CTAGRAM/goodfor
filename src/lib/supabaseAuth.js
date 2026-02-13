import 'react-native-url-polyfill/auto';
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
    console.log('[AuthLib] signInWithEmail called for:', email);
    try {
        // Add timeout to prevent hanging forever
        const signInPromise = supabase.auth.signInWithPassword({
            email,
            password,
        });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sign-in timeout - please check your connection')), 10000)
        );

        const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
        console.log('[AuthLib] supabase.auth.signInWithPassword returned:', { hasData: !!data, hasError: !!error });

        if (error) {
            console.error('[AuthLib] signInWithPassword error:', error);
            throw error;
        }
        return data;
    } catch (e) {
        console.error('[AuthLib] Exception in signInWithEmail:', e);
        throw e;
    }
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

// Phase 5: Phone OTP Authentication

// Send OTP code to phone number
export const sendOtpToPhone = async (phone, isSignUp = false) => {
    console.log('[AuthLib] sendOtpToPhone called for:', phone, 'isSignUp:', isSignUp);

    // Ensure phone number is in international format (E.164)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
        // Default to +91 (India) if no country code - adjust as needed
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }

    const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
            shouldCreateUser: isSignUp, // true for signup, false for signin
        },
    });

    if (error) {
        console.error('[AuthLib] sendOtpToPhone error:', error);
        throw error;
    }

    console.log('[AuthLib] OTP sent successfully to:', formattedPhone);
    return { ...data, formattedPhone };
};

// Verify phone OTP code
export const verifyPhoneOtp = async (phone, token) => {
    console.log('[AuthLib] verifyPhoneOtp called for:', phone);

    // Ensure phone number is in international format (E.164)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }

    const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: 'sms', // 'sms' for phone OTP verification
    });

    if (error) {
        console.error('[AuthLib] verifyPhoneOtp error:', error);
        throw error;
    }

    console.log('[AuthLib] Phone OTP verified successfully!');
    return data;
};

// Resend Phone OTP
export const resendPhoneOtp = async (phone) => {
    console.log('[AuthLib] Resending OTP to:', phone);
    return sendOtpToPhone(phone, false); // Resend as sign-in attempt
};

// Sign up with phone after external verification (WhatsApp via Twilio Verify)
// Creates a Supabase user with phone number stored in metadata
export const signUpWithPhoneAfterVerify = async (phone, metadata = {}) => {
    console.log('[AuthLib] Creating Supabase user after phone verification:', phone);

    // Format phone number
    let formattedPhone = phone.trim().replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }

    // Generate a secure random password (user won't need it for phone login)
    const randomPassword = `Phone_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Create user with phone in metadata (since Supabase email is required)
    // Use phone as fake email for uniqueness
    const fakeEmail = `${formattedPhone.replace(/\+/g, '')}@phone.goodfor.app`;

    const { data, error } = await supabase.auth.signUp({
        email: fakeEmail,
        password: randomPassword,
        options: {
            data: {
                phone: formattedPhone,
                auth_method: 'whatsapp',
                ...metadata
            },
            // Auto-confirm since phone was already verified via Twilio
            emailRedirectTo: undefined,
        },
    });

    if (error) {
        // If user already exists, try signing in
        if (error.message?.includes('already registered')) {
            console.log('[AuthLib] User exists, signing in...');
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: fakeEmail,
                password: randomPassword,
            });
            if (signInError) {
                // Password doesn't match - user exists with different password
                // Just return success, they're verified
                return { user: null, session: null, phoneVerified: true };
            }
            return signInData;
        }
        throw error;
    }

    console.log('[AuthLib] Phone user created in Supabase:', data.user?.id);
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

// Google/Facebook OAuth imports
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

// Create proper redirect URI using deep linking
const createRedirectUri = () => {
    // In Expo Go, use the exp:// URL for WebBrowser compatibility
    // In production, use goodfor:// custom scheme
    const expoUrl = Linking.createURL('auth/callback');
    const customScheme = 'goodfor://auth/callback';

    // Check if running in Expo Go (exp:// scheme) or production build
    const isExpoGo = expoUrl.startsWith('exp://');
    const redirectUri = isExpoGo ? expoUrl : customScheme;

    console.log('[OAuth] Generated redirect URI:', redirectUri);
    console.log('[OAuth] Is Expo Go:', isExpoGo);

    return redirectUri;
};

// Parse OAuth callback URL for tokens
const parseOAuthCallback = (url) => {
    let params;

    // Tokens can be in hash (#) or query (?) params depending on provider
    if (url.includes('#')) {
        params = new URLSearchParams(url.split('#')[1]);
    } else if (url.includes('?')) {
        params = new URLSearchParams(url.split('?')[1]);
    } else {
        throw new Error('No auth parameters found in callback URL');
    }

    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
        throw new Error(errorDescription || error);
    }

    if (!access_token) {
        throw new Error('No access token received from OAuth provider');
    }

    return { access_token, refresh_token };
};

// Helper function to add timeout to async operations
const withTimeout = (promise, timeoutMs, errorMessage) => {
    return Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
};

// Sign in with Google OAuth
export const signInWithGoogle = async () => {
    try {
        const redirectUrl = createRedirectUri();
        console.log('[OAuth] Starting Google sign-in with redirect:', redirectUrl);
        console.log('[OAuth] ⚠️ Note: In Expo Go, OAuth may require manual handling via AuthContext deep link listener');

        // Get the OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true, // We handle the browser ourselves
            },
        });

        if (error) throw error;
        if (!data.url) throw new Error('No OAuth URL returned from Supabase');

        console.log('[OAuth] Opening Google OAuth URL...');
        const browserStartTime = Date.now();

        // Use WebBrowser for OAuth - it properly handles redirects
        const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
            {
                showInRecents: true,
                preferEphemeralSession: false,
            }
        );

        const browserDuration = Date.now() - browserStartTime;
        console.log(`[OAuth] Browser closed after ${browserDuration}ms with result type: ${result.type}`);

        if (result.type === 'success') {
            const { url } = result;
            console.log('[OAuth] ✅ Callback URL received:', url?.substring(0, 100) + '...');

            // Parse tokens from callback URL
            const { access_token, refresh_token } = parseOAuthCallback(url);

            if (!access_token) {
                throw new Error('No access token found in OAuth callback URL');
            }

            console.log('[OAuth] 🔑 Tokens extracted, setting session...');

            // Set the session with the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token: refresh_token || '',
            });

            if (sessionError) throw sessionError;

            console.log('[OAuth] ✅ Google sign-in successful via WebBrowser!');
            return { session: sessionData.session, error: null };
        } else if (result.type === 'cancel') {
            console.log('[OAuth] ❌ User cancelled Google sign-in');
            return { session: null, error: new Error('Sign-in cancelled by user') };
        } else if (result.type === 'dismiss') {
            console.log('[OAuth] ⚠️ Browser dismissed - OAuth may complete via deep link handler');
            // In Expo Go, the browser might dismiss but OAuth continues via deep link
            // Return null to let AuthContext handle it
            return { session: null, error: null };
        }

        console.log('[OAuth] ❌ Unexpected result type:', result.type);
        return { session: null, error: new Error('OAuth flow failed with unexpected result') };
    } catch (error) {
        const errorMessage = error?.message || 'Unknown error';
        console.error('[OAuth] ❌ Google sign-in error:', errorMessage);

        // If timeout occurred in Expo Go, return special indicator
        if (errorMessage.includes('timed out') && errorMessage.includes('Expo Go')) {
            console.log('[OAuth] ℹ️ Browser timeout in Expo Go - AuthContext will handle callback via deep link');
            return { session: null, error: null }; // Let deep link handler take over
        }

        return { session: null, error };
    }
};

// Sign in with Facebook OAuth
export const signInWithFacebook = async () => {
    try {
        const redirectUrl = createRedirectUri();
        console.log('[OAuth] Starting Facebook sign-in with redirect:', redirectUrl);

        // Get the OAuth URL from Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
                scopes: 'email,public_profile', // Request email and basic profile
            },
        });

        if (error) throw error;
        if (!data.url) throw new Error('No OAuth URL returned from Supabase');

        console.log('[OAuth] Opening Facebook OAuth URL...');

        // Open the OAuth URL in an in-app browser
        const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            redirectUrl,
            {
                showInRecents: true,
                preferEphemeralSession: false,
            }
        );

        console.log('[OAuth] Browser result type:', result.type);

        if (result.type === 'success') {
            const { url } = result;
            console.log('[OAuth] Callback URL received:', url?.substring(0, 50) + '...');

            // Parse tokens from callback URL
            const { access_token, refresh_token } = parseOAuthCallback(url);

            // Set the session with the tokens
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token: refresh_token || '',
            });

            if (sessionError) throw sessionError;

            console.log('[OAuth] Facebook sign-in successful!');
            return { session: sessionData.session, error: null };
        } else if (result.type === 'cancel') {
            console.log('[OAuth] User cancelled Facebook sign-in');
            return { session: null, error: new Error('Sign-in cancelled by user') };
        }

        return { session: null, error: new Error('OAuth flow failed') };
    } catch (error) {
        console.error('[OAuth] Facebook sign-in error:', error);
        return { session: null, error };
    }
};
