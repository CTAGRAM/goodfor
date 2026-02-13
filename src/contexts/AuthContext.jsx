import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseAuth';
import * as Linking from 'expo-linking';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';

const AuthContext = createContext({});

// Timeout duration for profile loading (10 seconds)
const PROFILE_LOAD_TIMEOUT = 10000;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [activeFamilyMember, setActiveFamilyMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    // Refs to prevent duplicate calls and implement timeout
    const isLoadingProfile = useRef(false);
    const loadingTimeout = useRef(null);
    const profileLoadStartTime = useRef(null);

    // Handle navigation based on auth state
    useEffect(() => {
        if (!navigationState?.key) return; // Navigation not ready

        const inAuthGroup = segments[0] === '(tabs)';
        const inOnboarding = segments[0] === 'onboarding';
        const inAuthFlow = segments[0] === 'sign-in' || segments[0] === 'sign-up' || segments[0] === 'auth';
        const isIndex = segments.length === 0 || segments[0] === 'index';

        if (!loading) {
            if (user && profile) {
                // User is authenticated with profile
                if (!profile.is_profile_completed) {
                    const isEditingProfile = segments[0] === 'edit-profile';
                    if (!isEditingProfile) {
                        console.log('[AuthContext] Profile incomplete, redirecting to edit-profile');
                        router.replace('/edit-profile');
                        return;
                    }
                } else if (inAuthFlow || isIndex || segments[0] === 'edit-profile') {
                    // Only redirect from auth screens or index. 
                    // NOTE: Removed generic redirect from edit-profile to allow user to stay there if they navigated manually, 
                    // BUT if we just completed profile, we might want to go home. 
                    // For now, let's stick to the requested "redirect to home" in edit-profile.jsx.
                    if (inAuthFlow || isIndex) {
                        console.log('[AuthContext] User authenticated, redirecting to home from:', segments[0]);
                        router.replace('/(tabs)/home');
                    }
                }
            } else if (!user && inAuthGroup) {
                // User is not signed in but trying to access protected routes
                console.log('[AuthContext] User not authenticated, redirecting to sign-in');
                router.replace('/sign-in');
            }
        }
    }, [user, profile, loading, segments, navigationState?.key]);

    // Ref to track latest user value (avoids stale closures in timeout callbacks)
    const userRef = useRef(null);

    // Keep userRef in sync
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        // Check active session — this is the PRIMARY first-launch path
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[AuthContext] 🔐 Checking active session:', { hasSession: !!session });
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes (sign-in, sign-out, etc.)
        // NOTE: TOKEN_REFRESHED and INITIAL_SESSION are skipped because
        // getSession() above already handles the initial load.
        // This prevents the race condition where TOKEN_REFRESHED fires
        // before getSession resolves, causing a duplicate loadProfile call.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log('[AuthContext] 🔄 Auth state changed:', _event);

                // Skip events that are handled by getSession() above
                if (_event === 'TOKEN_REFRESHED' || _event === 'INITIAL_SESSION') {
                    console.log(`[AuthContext] ⏭️ Skipping ${_event} - handled by getSession()`);
                    return;
                }

                setUser(session?.user ?? null);
                if (session?.user) {
                    // Only load profile for real auth events (SIGNED_IN, USER_UPDATED)
                    if (!isLoadingProfile.current) {
                        await loadProfile(session.user.id);
                    } else {
                        console.log('[AuthContext] ⏭️ Skipping loadProfile - already in progress');
                    }
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        // Cleanup function
        return () => {
            console.log('[AuthContext] 🧹 Cleaning up auth listeners');
            subscription.unsubscribe();

            // Clear any pending timeout
            if (loadingTimeout.current) {
                clearTimeout(loadingTimeout.current);
            }
        };
    }, []);

    // Deep link listener for OAuth callback (Expo Go workaround)
    useEffect(() => {
        const handleDeepLink = async (event) => {
            const url = event.url;
            const deepLinkStartTime = Date.now();
            console.log('[AuthContext] 🔗 Deep link received:', url);

            // Check if this is an OAuth callback
            if (url.includes('auth/callback') || url.includes('#access_token')) {
                console.log('[AuthContext] 🔐 Processing OAuth callback...');

                try {
                    let params;
                    if (url.includes('#')) {
                        params = new URLSearchParams(url.split('#')[1]);
                    } else if (url.includes('?')) {
                        params = new URLSearchParams(url.split('?')[1]);
                    }

                    if (params) {
                        const access_token = params.get('access_token');
                        const refresh_token = params.get('refresh_token');

                        if (access_token) {
                            console.log('[AuthContext] 🔑 Setting session from deep link...');
                            const sessionStartTime = Date.now();

                            const { error } = await supabase.auth.setSession({
                                access_token,
                                refresh_token: refresh_token || '',
                            });

                            const sessionTime = Date.now() - sessionStartTime;

                            if (error) {
                                console.error(`[AuthContext] ❌ Error setting session (${sessionTime}ms):`, error);
                            } else {
                                const totalTime = Date.now() - deepLinkStartTime;
                                console.log(`[AuthContext] ✅ Session set successfully from deep link! (${totalTime}ms)`);
                                console.log('[AuthContext] Navigation will be handled by navigation effect once profile loads');
                            }
                        }
                    }
                } catch (error) {
                    const elapsed = Date.now() - deepLinkStartTime;
                    console.error(`[AuthContext] ❌ Deep link processing error after ${elapsed}ms:`, error);
                }
            }
        };

        console.log('[AuthContext] 🎧 Setting up deep link listeners');

        // Subscribe to deep links
        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check if app was opened by a deep link (initial URL)
        Linking.getInitialURL().then((url) => {
            if (url) {
                console.log('[AuthContext] 🚀 Initial URL detected:', url);
                handleDeepLink({ url });
            }
        });

        return () => {
            console.log('[AuthContext] 🧹 Cleaning up deep link listeners');
            subscription?.remove();
        };
    }, []);

    const loadProfile = async (userId, retryCount = 0) => {
        // Prevent duplicate concurrent calls
        if (isLoadingProfile.current) {
            console.log('[AuthContext] ⏭️ Profile load already in progress, skipping duplicate call');
            return;
        }

        isLoadingProfile.current = true;
        profileLoadStartTime.current = Date.now();

        // Clear any existing timeout
        if (loadingTimeout.current) {
            clearTimeout(loadingTimeout.current);
        }

        // Set timeout protection (10 seconds)
        loadingTimeout.current = setTimeout(() => {
            const elapsed = Date.now() - profileLoadStartTime.current;
            console.warn(`[AuthContext] ⏱️ Profile load timeout after ${elapsed}ms - forcing navigation`);

            // Create minimal profile from user data to allow navigation
            // Use userRef.current (not `user`) to avoid stale closure
            const currentUser = userRef.current;
            if (currentUser && !profile) {
                const metadata = currentUser.user_metadata || {};
                const minimalProfile = {
                    id: userId,
                    full_name: metadata.full_name || metadata.name || currentUser.email?.split('@')[0] || 'User',
                    email: currentUser.email,
                    avatar_url: metadata.avatar_url || metadata.picture || null,
                    age_group: 'adult',
                    is_profile_completed: false,
                };
                console.log('[AuthContext] Setting minimal profile for timeout recovery');
                setProfile(minimalProfile);
            }

            setLoading(false);
            isLoadingProfile.current = false;
        }, PROFILE_LOAD_TIMEOUT);

        try {
            console.log(`[AuthContext] 🔄 loadProfile called with userId: ${userId} (attempt ${retryCount + 1})`);
            const startTime = Date.now();

            // Step 1: Try to fetch existing profile
            let { data, error } = await supabase
                .from('profiles')
                .select('*, active_family_member_id')
                .eq('id', userId)
                .single();

            const queryTime = Date.now() - startTime;
            console.log(`[AuthContext] Profile query completed in ${queryTime}ms:`, {
                hasData: !!data,
                errorCode: error?.code,
                name: data?.full_name
            });

            // Step 2: Handle profile not found (new OAuth user)
            if (error && error.code === 'PGRST116') {
                console.log('[AuthContext] 🆕 No profile found, creating one for new user...');

                // Get user metadata
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    const metadata = authUser.user_metadata || {};
                    const newProfile = {
                        id: userId,
                        full_name: metadata.full_name || metadata.name || authUser.email?.split('@')[0] || 'User',
                        email: authUser.email,
                        avatar_url: metadata.avatar_url || metadata.picture || null,
                        age_group: 'adult',
                        is_profile_completed: false,
                    };

                    console.log('[AuthContext] Creating profile with:', {
                        name: newProfile.full_name,
                        email: newProfile.email
                    });

                    const createStartTime = Date.now();
                    const { data: createdProfile, error: createError } = await supabase
                        .from('profiles')
                        .insert(newProfile)
                        .select()
                        .single();

                    const createTime = Date.now() - createStartTime;

                    if (createError) {
                        console.error(`[AuthContext] ❌ Profile creation error (${createTime}ms):`, createError);

                        // Handle duplicate key constraint (race condition)
                        if (createError.code === '23505' || createError.code === 'PGRST23505') {
                            console.log('[AuthContext] 🔄 Duplicate profile detected, fetching existing...');
                            // Fetch the existing profile instead
                            const { data: existingProfile, error: fetchError } = await supabase
                                .from('profiles')
                                .select('*, active_family_member_id')
                                .eq('id', userId)
                                .single();

                            if (!fetchError && existingProfile) {
                                data = existingProfile;
                                console.log('[AuthContext] ✅ Retrieved existing profile after conflict');
                            } else {
                                throw createError; // Re-throw if we still can't get profile
                            }
                        } else if (retryCount < 1) {
                            // Retry once for transient errors (network, etc.)
                            console.log('[AuthContext] 🔄 Retrying profile creation after 1 second...');
                            isLoadingProfile.current = false; // Reset flag for retry
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            return loadProfile(userId, retryCount + 1);
                        } else {
                            throw createError; // Give up after retry
                        }
                    } else {
                        data = createdProfile;
                        console.log(`[AuthContext] ✅ Profile created successfully in ${createTime}ms`);
                    }
                }
            } else if (error) {
                console.error('[AuthContext] ❌ Profile query error:', error);

                // Retry once for transient errors
                if (retryCount < 1) {
                    console.log('[AuthContext] 🔄 Retrying profile query after 1 second...');
                    isLoadingProfile.current = false; // Reset flag for retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return loadProfile(userId, retryCount + 1);
                }

                throw error; // Give up after retry
            }

            // Step 3: Set profile state (always executed if we got this far)
            if (data) {
                const totalTime = Date.now() - profileLoadStartTime.current;
                console.log(`[AuthContext] ✅ Setting profile state (total time: ${totalTime}ms):`, {
                    name: data?.full_name,
                    email: data?.email
                });
                setProfile(data);

                // Step 4: Load active family member if set (non-blocking)
                if (data?.active_family_member_id) {
                    const { data: member, error: memberError } = await supabase
                        .from('family_members')
                        .select('*')
                        .eq('id', data.active_family_member_id)
                        .single();

                    if (!memberError) {
                        setActiveFamilyMember(member);
                    }
                } else {
                    setActiveFamilyMember(null);
                }
            } else {
                // Fallback: create minimal profile from user object
                console.warn('[AuthContext] ⚠️ No profile data available, creating minimal profile');
                if (user) {
                    const metadata = user.user_metadata || {};
                    const minimalProfile = {
                        id: userId,
                        full_name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User',
                        email: user.email,
                        avatar_url: metadata.avatar_url || metadata.picture || null,
                        age_group: 'adult',
                        is_profile_completed: false,
                    };
                    setProfile(minimalProfile);
                }
            }
        } catch (error) {
            const elapsed = Date.now() - profileLoadStartTime.current;
            console.error(`[AuthContext] ❌ Error loading profile after ${elapsed}ms:`, error);

            // Emergency fallback: create minimal profile to allow navigation
            if (user && !profile) {
                console.log('[AuthContext] 🆘 Creating emergency fallback profile');
                const metadata = user.user_metadata || {};
                const fallbackProfile = {
                    id: userId,
                    full_name: metadata.full_name || metadata.name || user.email?.split('@')[0] || 'User',
                    email: user.email,
                    avatar_url: metadata.avatar_url || metadata.picture || null,
                    age_group: 'adult',
                    is_profile_completed: false,
                };
                setProfile(fallbackProfile);
            }
        } finally {
            // Always complete loading
            const totalElapsed = Date.now() - profileLoadStartTime.current;
            console.log(`[AuthContext] 🏁 Profile loading completed in ${totalElapsed}ms`);

            // Clear timeout
            if (loadingTimeout.current) {
                clearTimeout(loadingTimeout.current);
                loadingTimeout.current = null;
            }

            setLoading(false);
            isLoadingProfile.current = false;
        }
    };

    const switchProfile = async (memberId) => {
        try {
            // Optimistic update
            if (!memberId || memberId === 'main') {
                setActiveFamilyMember(null);
            } else {
                // We don't have the full member object here immediately unless passed
                // But usually we want to fetch it or rely on loading.
                // For better UX, we'll fetch it or better, reload profile.
            }

            const dbValue = (memberId === 'main' || !memberId) ? null : memberId;

            const { data, error } = await supabase
                .from('profiles')
                .update({ active_family_member_id: dbValue })
                .eq('id', user.id)
                .select()
                .single();

            if (error) throw error;

            setProfile(data); // keys stored in profile might update

            if (memberId) {
                const { data: member, error: memberError } = await supabase
                    .from('family_members')
                    .select('*')
                    .eq('id', memberId)
                    .single();
                if (!memberError) setActiveFamilyMember(member);
            } else {
                setActiveFamilyMember(null);
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error switching profile:', error);
            return { error };
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            setUser(null);
            setProfile(null);
            setActiveFamilyMember(null);
        }
        return { error };
    };

    const updateProfile = async (updates) => {
        if (!user) return { error: new Error('No user logged in') };

        console.log('[AuthContext] 📝 updateProfile called with columns:', Object.keys(updates));
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id)
                .select()
                .single();

            if (error) {
                console.error('[AuthContext] ❌ updateProfile Supabase error:', error);
                return { data: null, error };
            }

            if (data) {
                console.log('[AuthContext] ✅ updateProfile success:', { id: data.id });
                setProfile(data);
            }
            return { data, error: null };
        } catch (err) {
            console.error('[AuthContext] 💥 updateProfile execution error:', err);
            return { data: null, error: err };
        }
    };

    const value = {
        user,
        profile,
        activeFamilyMember,
        loading,
        signOut,
        updateProfile,
        switchProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Convenience hook for just profile
export function useProfile() {
    const { profile, loading } = useAuth();
    return { profile, loading };
}
