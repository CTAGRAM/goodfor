import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Alert } from 'react-native';
import { supabase } from '@/lib/supabaseAuth';
import { useAuth } from './AuthContext';

const RevenueCatContext = createContext(null);

export const RevenueCatProvider = ({ children }) => {
    const { user } = useAuth();
    const [customerInfo, setCustomerInfo] = useState(null);
    const [offerings, setOfferings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const lastLoggedInUserId = useRef(null);

    // Initialize RevenueCat on mount
    useEffect(() => {
        initializeRevenueCat();
    }, []);

    // Sync RevenueCat login state with Supabase auth
    useEffect(() => {
        if (!isInitialized) return;

        const syncUserWithRevenueCat = async () => {
            if (user?.id && lastLoggedInUserId.current !== user.id) {
                // User logged in - sync with RevenueCat
                console.log('[RevenueCat] Syncing user:', user.id);
                try {
                    const { customerInfo } = await Purchases.logIn(user.id);
                    lastLoggedInUserId.current = user.id;
                    updateCustomerInfo(customerInfo);
                    console.log('[RevenueCat] User synced successfully');
                } catch (error) {
                    console.error('[RevenueCat] Login sync error:', error.message);
                }
            } else if (!user && lastLoggedInUserId.current) {
                // User logged out - reset to anonymous
                console.log('[RevenueCat] User logged out, resetting to anonymous');
                try {
                    const customerInfo = await Purchases.logOut();
                    lastLoggedInUserId.current = null;
                    updateCustomerInfo(customerInfo);
                    console.log('[RevenueCat] Reset to anonymous successfully');
                } catch (error) {
                    console.error('[RevenueCat] Logout sync error:', error.message);
                }
            }
        };

        syncUserWithRevenueCat();
    }, [user, isInitialized]);

    const initializeRevenueCat = async () => {
        try {
            const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

            if (!apiKey) {
                console.warn('[RevenueCat] API key not found - skipping initialization');
                setIsLoading(false);
                return;
            }

            // Check if running in Expo Go - skip RevenueCat as it doesn't work there
            const isExpoGo = typeof expo !== 'undefined' ||
                global.__expo ||
                (typeof global.expo !== 'undefined');

            if (isExpoGo) {
                console.log('[RevenueCat] Running in Expo Go - purchases disabled (skipping config)');
                setIsLoading(false);
                return;
            }

            // Also detect via the error message pattern - if configure fails, just skip
            try {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG);
                await Purchases.configure({ apiKey });
                setIsInitialized(true);
                console.log('[RevenueCat] SDK configured successfully');
            } catch (configError) {
                // In Expo Go, just skip RevenueCat silently
                if (configError.message?.includes('Invalid API key') ||
                    configError.message?.includes('Expo Go') ||
                    configError.message?.includes('native store')) {
                    console.log('[RevenueCat] Configuration failed (expected in simple environment)');
                    setIsLoading(false);
                    return;
                }
                console.warn('[RevenueCat] Configuration failed:', configError.message);
                setIsLoading(false);
                return;
            }


            // Set up listener for customer info updates
            Purchases.addCustomerInfoUpdateListener((info) => {
                console.log('[RevenueCat] CustomerInfo updated via listener');
                updateCustomerInfo(info);
            });

            // Get initial customer info
            try {
                const info = await Purchases.getCustomerInfo();
                updateCustomerInfo(info);
            } catch (infoError) {
                console.warn('[RevenueCat] Could not get customer info:', infoError.message);
            }

            // Load offerings
            await loadOfferings();

            setIsLoading(false);
        } catch (error) {
            console.warn('[RevenueCat] Initialization error:', error.message);
            setIsLoading(false);
        }
    };

    const updateCustomerInfo = async (info) => {
        setCustomerInfo(info);

        // Check for "GoodFor Pro" entitlement
        const hasProEntitlement = info?.entitlements?.active?.['GoodFor Pro'] !== undefined;
        console.log('[RevenueCat] Pro entitlement status:', hasProEntitlement, 'for user:', info?.originalAppUserId);
        setIsPro(hasProEntitlement);

        // Sync to Supabase Profiles if user is logged in
        if (user?.id) {
            const tier = hasProEntitlement ? 'pro' : 'free';
            console.log(`[RevenueCat] Syncing subscription_tier='${tier}' to Supabase for user ${user.id}`);

            // We use upsert or update. Since profile should exist, update is safer.
            // We verify if the current profile already has this tier to avoid loops, 
            // but for now, a simple update is fine as this checks active status.
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ subscription_tier: tier })
                    .eq('id', user.id);

                if (error) console.error('[RevenueCat] Failed to sync tier to Supabase:', error);
                else console.log('[RevenueCat] Synced tier to Supabase successfully');
            } catch (err) {
                console.error('[RevenueCat] Error syncing tier:', err);
            }
        }
    };

    const loadOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            setOfferings(offerings);

            // Detailed logging to diagnose "no package available" issues
            console.log('[RevenueCat] Offerings loaded:', {
                current: offerings?.current?.identifier,
                allOfferingsCount: Object.keys(offerings?.all || {}).length,
                availablePackages: offerings?.current?.availablePackages?.map(p => ({
                    identifier: p.identifier,
                    packageType: p.packageType,
                    productId: p.product?.identifier,
                }))
            });

            if (!offerings?.current) {
                console.warn('[RevenueCat] No current offering available! Check RevenueCat dashboard.');
            } else if (!offerings?.current?.availablePackages?.length) {
                console.warn('[RevenueCat] Current offering has no packages! Configure products in RevenueCat.');
            }
        } catch (error) {
            console.error('[RevenueCat] Error loading offerings:', error.message);
        }
    };


    const purchasePackage = async (packageToPurchase) => {
        try {
            setIsLoading(true);
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            updateCustomerInfo(customerInfo);
            setIsLoading(false);
            return { success: true, customerInfo };
        } catch (error) {
            setIsLoading(false);

            if (error.userCancelled) {
                return { success: false, cancelled: true };
            }

            console.error('[RevenueCat] Purchase error:', error);
            Alert.alert('Purchase Failed', error.message || 'An error occurred during purchase');
            return { success: false, error };
        }
    };

    const restorePurchases = async () => {
        try {
            setIsLoading(true);
            const customerInfo = await Purchases.restorePurchases();
            updateCustomerInfo(customerInfo);
            setIsLoading(false);

            if (customerInfo.entitlements.active['GoodFor Pro']) {
                Alert.alert('Success', 'Your purchases have been restored!');
            } else {
                Alert.alert('No Purchases Found', 'We couldn\'t find any active subscriptions to restore.');
            }

            return customerInfo;
        } catch (error) {
            setIsLoading(false);
            console.error('[RevenueCat] Restore error:', error);
            Alert.alert('Restore Failed', error.message || 'An error occurred while restoring purchases');
            throw error;
        }
    };

    const checkEntitlement = (entitlementId = 'GoodFor Pro') => {
        return customerInfo?.entitlements?.active?.[entitlementId] !== undefined;
    };

    const value = {
        customerInfo,
        offerings,
        isLoading,
        isPro,
        isInitialized,
        purchasePackage,
        restorePurchases,
        checkEntitlement,
        refreshCustomerInfo: async () => {
            try {
                const info = await Purchases.getCustomerInfo();
                updateCustomerInfo(info);
                return info;
            } catch (error) {
                console.error('[RevenueCat] Refresh error:', error);
                return null;
            }
        },
    };

    return (
        <RevenueCatContext.Provider value={value}>
            {children}
        </RevenueCatContext.Provider>
    );
};

export const useRevenueCat = () => {
    const context = useContext(RevenueCatContext);
    if (!context) {
        throw new Error('useRevenueCat must be used within RevenueCatProvider');
    }
    return context;
};
