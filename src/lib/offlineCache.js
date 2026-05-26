import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'product_cache_';
const CACHE_EXPIRY_DAYS = 30;

/**
 * Generate a cache key for a barcode
 */
const getCacheKey = (barcode) => `${CACHE_PREFIX}${barcode}`;

/**
 * Save a product to the offline cache
 */
export async function cacheProductOffline(barcode, productData) {
    if (!barcode || !productData) return;
    
    try {
        const cacheEntry = {
            data: productData,
            timestamp: new Date().getTime()
        };
        await AsyncStorage.setItem(getCacheKey(barcode), JSON.stringify(cacheEntry));
    } catch (error) {
        console.warn(`[OfflineCache] Failed to cache product ${barcode}:`, error);
    }
}

/**
 * Retrieve a product from the offline cache
 */
export async function getCachedProductOffline(barcode) {
    if (!barcode) return null;

    try {
        const entryStr = await AsyncStorage.getItem(getCacheKey(barcode));
        if (!entryStr) return null;

        const entry = JSON.parse(entryStr);
        const now = new Date().getTime();
        const daysOld = (now - entry.timestamp) / (1000 * 60 * 60 * 24);

        // If older than expiry, remove it and return null
        if (daysOld > CACHE_EXPIRY_DAYS) {
            await AsyncStorage.removeItem(getCacheKey(barcode));
            return null;
        }

        return entry.data;
    } catch (error) {
        console.warn(`[OfflineCache] Failed to get product ${barcode}:`, error);
        return null;
    }
}

/**
 * Clear the entire product offline cache
 */
export async function clearOfflineCache() {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
        if (cacheKeys.length > 0) {
            await AsyncStorage.multiRemove(cacheKeys);
        }
        return cacheKeys.length;
    } catch (error) {
        console.error('[OfflineCache] Failed to clear cache:', error);
        throw error;
    }
}

/**
 * Get cache stats (size, number of items)
 */
export async function getOfflineCacheStats() {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
        
        let totalSize = 0;
        if (cacheKeys.length > 0) {
            const items = await AsyncStorage.multiGet(cacheKeys);
            // Rough size estimate in bytes
            totalSize = items.reduce((acc, [, val]) => acc + (val ? val.length : 0), 0);
        }

        return {
            itemCount: cacheKeys.length,
            sizeBytes: totalSize,
            sizeFormatted: (totalSize / 1024 / 1024).toFixed(2) + ' MB'
        };
    } catch (error) {
        console.error('[OfflineCache] Failed to get stats:', error);
        return { itemCount: 0, sizeBytes: 0, sizeFormatted: '0 MB' };
    }
}
