import { useRevenueCat } from '@/contexts/RevenueCatContext';

export const useEntitlement = (entitlementId = 'GoodFor Pro') => {
    const { customerInfo, isLoading, isPro } = useRevenueCat();

    const hasEntitlement = customerInfo?.entitlements?.active?.[entitlementId] !== undefined;

    return {
        hasEntitlement,
        isPro, // shorthand for GoodFor Pro
        isLoading,
        customerInfo,
    };
};
