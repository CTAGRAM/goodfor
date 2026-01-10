import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { LOG_LEVEL, PurchasesOfferings, CustomerInfo } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';

const RevenueCatContext = createContext(null);

export const RevenueCatProvider = ({ children }) => {
    const [customerInfo, setCustomerInfo] = useState(null);
    const [offerings, setOfferings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        initializeRevenueCat();
    }, []);

    const initializeRevenueCat = async () => {
        try {
            const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

            if (!apiKey) {
                console.error('RevenueCat API key not found');
                setIsLoading(false);
                return;
            }

            // Configure SDK
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);

            // Initialize with API key
            Purchases.configure({ apiKey });

            // Set up listener for customer info updates
            Purchases.addCustomerInfoUpdateListener((info) => {
                updateCustomerInfo(info);
            });

            // Get initial customer info
            const info = await Purchases.getCustomerInfo();
            updateCustomerInfo(info);

            // Load offerings
            await loadOfferings();

            setIsLoading(false);
        } catch (error) {
            console.error('Error initializing RevenueCat:', error);
            setIsLoading(false);
        }
    };

    const updateCustomerInfo = (info) => {
        setCustomerInfo(info);

        // Check for "GoodFor Pro" entitlement
        const hasProEntitlement = info?.entitlements?.active?.['GoodFor Pro'] !== undefined;
        setIsPro(hasProEntitlement);
    };

    const loadOfferings = async () => {
        try {
            const offerings = await Purchases.getOfferings();
            setOfferings(offerings);
        } catch (error) {
            console.error('Error loading offerings:', error);
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

            console.error('Purchase error:', error);
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
            console.error('Restore error:', error);
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
        purchasePackage,
        restorePurchases,
        checkEntitlement,
        refreshCustomerInfo: async () => {
            const info = await Purchases.getCustomerInfo();
            updateCustomerInfo(info);
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
