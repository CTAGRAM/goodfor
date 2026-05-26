import { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet, Switch, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Award, RefreshCw, LogOut, Database, Trash2, Palette, CreditCard,
  Wind, Leaf, BarChart2, Type, Info, ChevronRight, Bell, MessageCircle, Star, ShieldCheck
} from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabaseAuth';
import { useAlert } from "@/contexts/AlertContext";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { clearOfflineCache, getOfflineCacheStats } from "@/lib/offlineCache";

const INSIGHTS_PREFS_KEY = 'goodfor_insights_prefs';

export default function Settings() {
  const { showAlert } = useAlert();
  const router = useRouter();
  const { profile, activeFamilyMember } = useAuth();

  // State for toggles
  const [reduceMotion, setReduceMotion] = useState(false);
  const [envImpact, setEnvImpact] = useState(true);
  const [businessInsights, setBusinessInsights] = useState(false);
  const [isPrefsLoaded, setIsPrefsLoaded] = useState(false);
  const [cacheStats, setCacheStats] = useState({ itemCount: 0, sizeFormatted: '0 MB' });

  const opacity = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const loadCacheStats = async () => {
    const stats = await getOfflineCacheStats();
    setCacheStats(stats);
  };

  useFocusEffect(
    useCallback(() => {
      opacity.value = withTiming(1, { duration: 400 });
      loadCacheStats();
      return () => {
        opacity.value = 0;
      };
    }, [])
  );

  // Load saved preferences on mount
  useEffect(() => {
    loadInsightsPrefs();
  }, []);

  // Save preferences when they change (only after initial load)
  useEffect(() => {
    if (isPrefsLoaded) {
      saveInsightsPrefs();
    }
  }, [envImpact, businessInsights, isPrefsLoaded]);

  const loadInsightsPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem(INSIGHTS_PREFS_KEY);
      console.log('[Settings] Loaded prefs:', saved);
      if (saved) {
        const prefs = JSON.parse(saved);
        setEnvImpact(prefs.envImpact ?? true);
        setBusinessInsights(prefs.businessInsights ?? false);
      }
      // Mark as loaded AFTER setting states
      setIsPrefsLoaded(true);
    } catch (e) {
      console.error('[Settings] Error loading insights prefs:', e);
      setIsPrefsLoaded(true);
    }
  };

  const saveInsightsPrefs = async () => {
    try {
      const prefsToSave = { envImpact, businessInsights };
      console.log('[Settings] Saving prefs:', prefsToSave);
      await AsyncStorage.setItem(INSIGHTS_PREFS_KEY, JSON.stringify(prefsToSave));
    } catch (e) {
      console.error('[Settings] Error saving insights prefs:', e);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/sign-in');
  };

  const settingsSections = [
    {
      title: 'ACCOUNT',
      items: [
        { icon: Bell, label: 'Recall Alerts', subtitle: 'Product safety notifications', color: colors.chart3, destructive: false, onPress: () => router.push('/alerts') },
        { icon: CreditCard, label: 'My Loyalty Cards', subtitle: 'Store reward cards', color: colors.chart1, destructive: false, onPress: () => router.push('/loyalty-cards') },
        { icon: Award, label: 'Manage Subscription', color: colors.primary, destructive: false, onPress: () => router.push('/subscription') },
        { icon: RefreshCw, label: 'Restore Purchases', color: colors.primary, destructive: false, onPress: () => showAlert('Restore Purchases', 'This feature will be available soon!') },
        { icon: LogOut, label: 'Sign Out', color: colors.destructive, destructive: true, onPress: handleSignOut },
      ],
    },
    {
      title: 'PRIVACY',
      items: [
        { icon: Database, label: 'Data Usage Overview', subtitle: 'Manage your information', color: colors.primary, destructive: false, onPress: () => router.push('/data-usage') },
        { icon: Trash2, label: 'Delete Account', color: colors.destructive, destructive: true, onPress: () => router.push('/delete-account') },
      ],
    },
    {
      title: 'SUPPORT',
      items: [
        { icon: MessageCircle, label: 'Send Feedback', subtitle: 'Help us improve GoodFor', color: colors.chart1, destructive: false, onPress: () => Linking.openURL('mailto:hello@goodfor.app?subject=GoodFor%20App%20Feedback') },
        { icon: Star, label: 'Rate Us', subtitle: 'Leave a review on the App Store', color: colors.chart2, destructive: false, onPress: () => showAlert('Rate Us', 'Thank you for your support! Store links coming soon.') },
      ],
    },
    {
      title: 'LEGAL',
      items: [
        { icon: ShieldCheck, label: 'Terms & Conditions', color: colors.primary, destructive: false, onPress: () => router.push('/terms-and-conditions') },
        { icon: ShieldCheck, label: 'Privacy Policy', color: colors.primary, destructive: false, onPress: () => router.push('/privacy-policy') },
      ],
    },
  ];

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <StatusBar style="dark" />

      {/* Background blurs */}
      <View style={styles.blurTop} />
      <View style={styles.blurLeft} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>App preferences & account</Text>
        </View>
        <Pressable
          style={[styles.profilePicture, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}
          onPress={() => { hapticLight(); router.push('/edit-profile'); }}
        >
          {(activeFamilyMember?.avatar_url || profile?.avatar_url) ? (
            <Image
              source={{ uri: activeFamilyMember?.avatar_url || profile?.avatar_url }}
              style={styles.profileImage}
            />
          ) : (
            <Text style={{ fontSize: 16, fontFamily: fonts.sansBold, color: colors.primaryForeground }}>
              {getInitials(activeFamilyMember?.name || profile?.full_name || profile?.email || '?')}
            </Text>
          )}
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account & Privacy Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const isLast = itemIndex === section.items.length - 1;
                return (
                  <Pressable
                    key={itemIndex}
                    style={[styles.settingItem, !isLast && styles.settingItemBorder]}
                    onPress={() => { item.destructive ? hapticMedium() : hapticLight(); item.onPress(); }}
                  >
                    <View style={styles.settingItemLeft}>
                      <View style={[
                        styles.iconContainer,
                        { backgroundColor: item.destructive ? `${colors.destructive}1A` : `${colors.accent}80` }
                      ]}>
                        <Icon size={24} color={item.color} />
                      </View>
                      <View>
                        <Text style={[styles.settingLabel, item.destructive && { color: colors.destructive }]}>
                          {item.label}
                        </Text>
                        {item.subtitle && (
                          <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={20} color={colors.mutedForeground} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}


        {/* Data Storage (Offline Cache) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATA STORAGE</Text>
          <View style={styles.card}>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <View style={styles.settingItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.chart2}1A` }]}>
                  <Database size={24} color={colors.chart2} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Offline Product Cache</Text>
                  <Text style={styles.settingSubtitle}>
                    {cacheStats.itemCount} items • {cacheStats.sizeFormatted}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={async () => {
                  hapticMedium();
                  await clearOfflineCache();
                  loadCacheStats();
                  showAlert('Cache Cleared', 'Offline product cache has been cleared.');
                }}
                style={{
                  backgroundColor: `${colors.destructive}1A`,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.full,
                }}
              >
                <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.destructive }}>Clear</Text>
              </Pressable>
            </View>
            <View style={styles.settingNote}>
              <Text style={styles.settingNoteText}>
                Recently scanned products are saved to your device to load faster and save data.
              </Text>
            </View>
          </View>
        </View>

        {/* Insights Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSIGHTS PREFERENCES</Text>
          <View style={styles.card}>
            <View style={[styles.settingItem, styles.settingItemBorder]}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                  <Leaf size={24} color={colors.primary} />
                </View>
                <Text style={[styles.settingLabel, { flex: 1 }]} numberOfLines={2}>Environmental impact indicators</Text>
              </View>
              <Switch
                value={envImpact}
                onValueChange={(val) => { hapticLight(); setEnvImpact(val); }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                  <BarChart2 size={24} color={colors.primary} />
                </View>
                <Text style={styles.settingLabel}>Business-level insights</Text>
              </View>
              <Switch
                value={businessInsights}
                onValueChange={(val) => { hapticLight(); setBusinessInsights(val); }}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
            <View style={styles.settingNote}>
              <Text style={styles.settingNoteText}>
                Shown only when relevant and never affects safety scores.
              </Text>
            </View>
          </View>
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCESSIBILITY</Text>
          <View style={styles.card}>
            <View style={styles.accessibilityItem}>
              <View style={styles.iconContainer}>
                <Type size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Dynamic Text Support</Text>
                <Text style={styles.accessibilityText}>
                  GoodFor follows your system font size settings to ensure comfortable reading across the app.
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.accessibilityItem}>
              <View style={styles.iconContainer}>
                <Info size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingLabel}>Motion Reduction</Text>
                <Text style={styles.accessibilityText}>
                  When enabled, we'll simplify transitions to help prevent motion sickness or eye strain.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Version 2.4.1 (882)</Text>
          <Text style={styles.versionText}>Made with ♥ by GoodFor</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  blurTop: {
    position: 'absolute',
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    backgroundColor: colors.accent,
    opacity: 0.4,
    borderRadius: 128,
  },
  blurLeft: {
    position: 'absolute',
    top: '25%',
    left: -96,
    width: 192,
    height: 192,
    backgroundColor: colors.chart1,
    opacity: 0.05,
    borderRadius: 96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing[14],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[6],
  },
  headerTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.sansExtraBold,
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sans,
    color: colors.mutedForeground,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[32],
  },
  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: fonts.sansBold,
    color: colors.mutedForeground,
    letterSpacing: 1.5,
    paddingHorizontal: spacing[1],
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius['3xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}66`,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    flex: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius['2xl'],
    backgroundColor: `${colors.accent}80`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.sansSemiBold,
    color: colors.foreground,
  },
  settingSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  settingValue: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sansMedium,
    color: colors.mutedForeground,
  },
  settingNote: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
  settingNoteText: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.mutedForeground,
  },
  accessibilityItem: {
    flexDirection: 'row',
    gap: spacing[4],
    padding: spacing[4],
  },
  accessibilityText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.sans,
    color: colors.mutedForeground,
    lineHeight: fontSizes.sm * 1.5,
  },
  divider: {
    height: 1,
    backgroundColor: `${colors.border}66`,
    marginHorizontal: spacing[4],
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  versionText: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.mutedForeground,
    marginTop: spacing[1],
  },
});
