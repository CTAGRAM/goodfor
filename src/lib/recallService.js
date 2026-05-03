/**
 * Product Recall Service — Multi-Country
 * 
 * Fetches product recalls from 3 sources:
 * - 🇺🇸 US FDA (api.fda.gov)
 * - 🇬🇧 UK FSA (data.food.gov.uk)
 * - 🇪🇺 EU RASFF (webgate.ec.europa.eu)
 * 
 * Auto-detects user region from device locale.
 */

import { Platform, NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── API Endpoints ───────────────────────────────────────────────
const FDA_API = 'https://api.fda.gov/food/enforcement.json';
const FSA_API = 'https://data.food.gov.uk/food-alerts/id';
const RASFF_API = 'https://data.europa.eu/api/hub/search/datasets';

// ─── Cache ───────────────────────────────────────────────────────
const CACHE_KEY = 'recall_cache_v2'; // bumped to invalidate stale URLs
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
let memoryCache = { data: null, timestamp: null, region: null };

// ─── Region Detection ────────────────────────────────────────────
const EU_COUNTRIES = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
    'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
    'SI', 'ES', 'SE', 'NO', 'IS', 'LI', 'CH'
];

/**
 * Get user's region from device locale or stored preference
 * @returns {string} 'us', 'uk', 'eu', or 'all'
 */
export const getUserRegion = async () => {
    try {
        const stored = await AsyncStorage.getItem('recall_region');
        if (stored) return stored;
    } catch (e) { /* ignore */ }

    // Auto-detect from device locale
    let locale = 'en-US';
    try {
        if (Platform.OS === 'ios') {
            locale = NativeModules.SettingsManager?.settings?.AppleLocale ||
                NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] || 'en-US';
        } else {
            locale = NativeModules.I18nManager?.localeIdentifier || 'en_US';
        }
    } catch (e) { /* ignore */ }

    const country = locale.split(/[-_]/).pop()?.toUpperCase() || 'US';

    if (country === 'US') return 'us';
    if (country === 'GB' || country === 'UK') return 'uk';
    if (EU_COUNTRIES.includes(country)) return 'eu';
    return 'all'; // Default: show all regions
};

/**
 * Save user's preferred region
 */
export const setUserRegion = async (region) => {
    await AsyncStorage.setItem('recall_region', region);
};

// ─── US FDA Fetcher ──────────────────────────────────────────────
const fetchFDARecalls = async (limit = 50) => {
    try {
        const response = await fetch(
            `${FDA_API}?limit=${limit}&sort=report_date:desc`
        );
        if (!response.ok) throw new Error(`FDA ${response.status}`);

        const data = await response.json();
        return (data.results || []).map(r => ({
            id: r.recall_number || `fda-${Date.now()}-${Math.random()}`,
            source: 'FDA',
            region: 'us',
            type: 'food',
            product: r.product_description || 'Unknown Product',
            brand: r.recalling_firm || '',
            reason: r.reason_for_recall || 'No reason specified',
            classification: r.classification || '',
            severity: mapFDASeverity(r.classification),
            status: r.status || '',
            date: parseFDADate(r.report_date),
            dateRaw: r.report_date,
            distribution: r.distribution_pattern || '',
            url: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts',
        }));
    } catch (error) {
        console.error('[RecallService] FDA fetch error:', error.message);
        return [];
    }
};

// ─── UK FSA Fetcher ──────────────────────────────────────────────
const fetchFSAAlerts = async (limit = 50) => {
    try {
        const response = await fetch(
            `${FSA_API}?_limit=${limit}&_sort=-modified`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (!response.ok) throw new Error(`FSA ${response.status}`);

        const data = await response.json();
        const items = data.items || data['@graph'] || [];

        return items.map(item => {
            // FSA type can be a string or array — normalize it
            const rawType = Array.isArray(item.type) ? item.type[0] : item.type;
            const typeStr = typeof rawType === 'string' ? rawType : (rawType?.label || rawType?.toString?.() || '');

            // Use the alertURL from the API directly (most reliable), or build from notation
            const notation = item.notation || '';
            const fsaPublicUrl = item.alertURL
                || (notation
                    ? `https://www.food.gov.uk/news-alerts/alert/${notation.toLowerCase()}`
                    : 'https://www.food.gov.uk/news-alerts/search/alerts');

            return {
                id: item['@id'] || notation || `fsa-${Date.now()}-${Math.random()}`,
                source: 'FSA',
                region: 'uk',
                type: mapFSAType(typeStr),
                product: item.title || item.description || 'Unknown Product',
                brand: item.reportingBusiness?.commonName || extractBrand(item.title || ''),
                reason: item.problem?.[0]?.riskStatement || item.description || item.title || 'No details available',
                classification: typeStr,
                severity: mapFSASeverity(typeStr),
                status: item.status?.label || item.status || 'Published',
                date: item.modified || item.created || new Date().toISOString(),
                dateRaw: item.modified || item.created,
                distribution: 'United Kingdom',
                url: fsaPublicUrl,
            };
        });
    } catch (error) {
        console.error('[RecallService] FSA fetch error:', error.message);
        return [];
    }
};

// ─── EU RASFF Fetcher ────────────────────────────────────────────
const fetchRASFFAlerts = async (limit = 50) => {
    try {
        // Use AbortController for timeout (AbortSignal.timeout not available in RN)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(
            `https://webgate.ec.europa.eu/rasff-window/backend/public/notification?p=1&ps=${limit}&ordering=-date`,
            {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal,
            }
        );
        clearTimeout(timeoutId);
        // RASFF backend frequently changes endpoints — gracefully handle 404/5xx
        if (!response.ok) {
            console.log('[RecallService] RASFF unavailable (status ' + response.status + '), skipping EU alerts');
            return [];
        }

        const data = await response.json();
        const items = data.results || data.content || data || [];
        const alerts = Array.isArray(items) ? items : [];

        return alerts.map(item => ({
            id: item.reference || item.id || `rasff-${Date.now()}-${Math.random()}`,
            source: 'RASFF',
            region: 'eu',
            type: 'food',
            product: item.subject || item.productCategory || 'Unknown Product',
            brand: item.origin || '',
            reason: item.subject || item.hazards?.[0]?.hazardCategory || 'No details',
            classification: typeof item.type === 'string' ? item.type : '',
            severity: mapRASFFSeverity(typeof item.type === 'string' ? item.type : (typeof item.notificationType === 'string' ? item.notificationType : '')),
            status: item.status || 'Published',
            date: item.date || item.notificationDate || new Date().toISOString(),
            dateRaw: item.date || item.notificationDate,
            distribution: item.distributionCountries?.join(', ') || item.countries?.join(', ') || 'EU',
            url: (item.reference || item.id)
                ? `https://webgate.ec.europa.eu/rasff-window/screen/notification/${item.reference || item.id}`
                : 'https://webgate.ec.europa.eu/rasff-window/screen/list',
        }));
    } catch (error) {
        // Silently handle — RASFF API is unreliable
        console.log('[RecallService] RASFF unavailable:', error.message?.substring(0, 50));
        return [];
    }
};

// ─── Unified Fetch ───────────────────────────────────────────────
/**
 * Fetch recalls from all sources based on region
 * @param {string} region - 'us', 'uk', 'eu', or 'all'
 * @param {boolean} forceRefresh - bypass cache
 * @returns {Promise<Array>} Sorted array of recalls
 */
export const fetchAllRecalls = async (region = null, forceRefresh = false) => {
    const userRegion = region || await getUserRegion();

    // Check memory cache
    if (!forceRefresh && memoryCache.data && memoryCache.region === userRegion &&
        memoryCache.timestamp && (Date.now() - memoryCache.timestamp) < CACHE_DURATION_MS) {
        console.log('[RecallService] Returning cached recalls');
        return memoryCache.data;
    }

    // Check persistent cache
    if (!forceRefresh) {
        try {
            const cached = await AsyncStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.region === userRegion &&
                    (Date.now() - parsed.timestamp) < CACHE_DURATION_MS) {
                    memoryCache = parsed;
                    return parsed.data;
                }
            }
        } catch (e) { /* ignore */ }
    }

    console.log(`[RecallService] Fetching recalls for region: ${userRegion}`);

    // Fetch from relevant sources
    const fetchers = [];
    if (userRegion === 'us' || userRegion === 'all') fetchers.push(fetchFDARecalls());
    if (userRegion === 'uk' || userRegion === 'all') fetchers.push(fetchFSAAlerts());
    if (userRegion === 'eu' || userRegion === 'all') fetchers.push(fetchRASFFAlerts());

    const results = await Promise.allSettled(fetchers);
    const allRecalls = results
        .filter(r => r.status === 'fulfilled')
        .flatMap(r => r.value);

    // Sort by date (newest first)
    allRecalls.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
    });

    // Cache results
    const cacheData = { data: allRecalls, timestamp: Date.now(), region: userRegion };
    memoryCache = cacheData;
    try {
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) { /* ignore storage errors */ }

    console.log(`[RecallService] Fetched ${allRecalls.length} total recalls`);
    return allRecalls;
};

// ─── Product Matching ────────────────────────────────────────────
/**
 * Check if a product matches any active recalls
 */
export const checkProductRecall = async (product) => {
    const recalls = await fetchAllRecalls();
    if (!recalls || recalls.length === 0) return null;

    const productName = (product.product_name || product.name || '').toLowerCase();
    const brand = (product.brands || product.brand || '').toLowerCase();

    for (const recall of recalls) {
        const recallProduct = (recall.product || '').toLowerCase();
        const recallBrand = (recall.brand || '').toLowerCase();

        // Brand + partial product name match
        if (brand && recallBrand && recallBrand.includes(brand)) {
            if (productName && recallProduct.includes(productName.slice(0, 10))) {
                return recall;
            }
        }

        // Exact product name match
        if (productName && productName.length > 3 && recallProduct.includes(productName)) {
            return recall;
        }
    }

    return null;
};

// ─── New Recalls Checker (for notifications) ─────────────────────
/**
 * Check for recalls newer than last check time
 * @returns {Array} New recalls since last check
 */
export const getNewRecalls = async () => {
    try {
        const lastCheckStr = await AsyncStorage.getItem('recall_last_check');
        const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : (Date.now() - 24 * 60 * 60 * 1000);

        const recalls = await fetchAllRecalls(null, true);

        // Filter to only recalls newer than last check
        const newRecalls = recalls.filter(r => {
            const recallDate = new Date(r.date).getTime();
            return recallDate > lastCheck;
        });

        // Update last check time
        await AsyncStorage.setItem('recall_last_check', Date.now().toString());

        return newRecalls;
    } catch (error) {
        console.error('[RecallService] Error checking new recalls:', error);
        return [];
    }
};

// ─── Helpers ─────────────────────────────────────────────────────

const parseFDADate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return new Date().toISOString();
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
};

const mapFDASeverity = (classification) => {
    if (classification === 'Class I') return 'dangerous';
    if (classification === 'Class II') return 'moderate';
    if (classification === 'Class III') return 'low';
    return 'unknown';
};

const mapFSAType = (type) => {
    if (!type || typeof type !== 'string') return 'food';
    const t = type.toLowerCase();
    if (t.includes('allergy')) return 'allergy';
    if (t.includes('recall')) return 'recall';
    return 'food';
};

const mapFSASeverity = (type) => {
    if (!type || typeof type !== 'string') return 'moderate';
    const t = type.toLowerCase();
    if (t.includes('action')) return 'dangerous';
    if (t.includes('recall') || t.includes('prin')) return 'moderate';
    if (t.includes('allergy')) return 'moderate';
    return 'low';
};

const mapRASFFSeverity = (type) => {
    if (!type || typeof type !== 'string') return 'moderate';
    const t = type.toLowerCase();
    if (t.includes('alert') || t.includes('serious')) return 'dangerous';
    if (t.includes('border') || t.includes('reject')) return 'moderate';
    if (t.includes('info') || t.includes('attention')) return 'low';
    return 'moderate';
};

const extractBrand = (title) => {
    // Try to extract brand from FSA title like "Brand - Product description"
    const dashIndex = title.indexOf(' - ');
    if (dashIndex > 0 && dashIndex < 40) return title.slice(0, dashIndex);
    return '';
};

// ─── Severity helpers (exported) ─────────────────────────────────
export const getRecallSeverity = (severityOrClassification) => {
    const severity = severityOrClassification?.toLowerCase() || '';

    if (severity === 'dangerous' || severity === 'class i') {
        return {
            level: 'dangerous',
            color: '#E63E11',
            label: 'Dangerous',
            description: 'Could cause serious health problems or death',
        };
    }
    if (severity === 'moderate' || severity === 'class ii') {
        return {
            level: 'moderate',
            color: '#EE8100',
            label: 'Moderate Risk',
            description: 'Might cause temporary or reversible health problems',
        };
    }
    if (severity === 'low' || severity === 'class iii') {
        return {
            level: 'low',
            color: '#FECB02',
            label: 'Low Risk',
            description: 'Unlikely to cause adverse health effects',
        };
    }
    return {
        level: 'unknown',
        color: '#9CA3AF',
        label: 'Unknown',
        description: 'Risk level not specified',
    };
};

export const formatRecallDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';

    // Handle FDA YYYYMMDD format
    if (dateStr.length === 8 && !dateStr.includes('-')) {
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        dateStr = `${year}-${month}-${day}`;
    }

    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Unknown date';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
};

export const clearRecallCache = async () => {
    memoryCache = { data: null, timestamp: null, region: null };
    await AsyncStorage.removeItem(CACHE_KEY);
    console.log('[RecallService] Cache cleared');
};

// ─── Region Labels ───────────────────────────────────────────────
export const REGION_OPTIONS = [
    { key: 'all', label: 'All Regions', emoji: '🌍' },
    { key: 'us', label: 'United States', emoji: '🇺🇸' },
    { key: 'uk', label: 'United Kingdom', emoji: '🇬🇧' },
    { key: 'eu', label: 'European Union', emoji: '🇪🇺' },
];

export const SOURCE_LABELS = {
    FDA: { name: 'US FDA', emoji: '🇺🇸', color: '#1A56DB' },
    FSA: { name: 'UK FSA', emoji: '🇬🇧', color: '#D4351C' },
    RASFF: { name: 'EU RASFF', emoji: '🇪🇺', color: '#003399' },
};
