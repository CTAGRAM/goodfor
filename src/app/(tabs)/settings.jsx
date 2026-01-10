import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, StyleSheet, Switch, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Award, RefreshCw, LogOut, Database, Trash2, Palette,
  Wind, Leaf, BarChart2, Type, Info, ChevronRight
} from 'lucide-react-native';
import { colors, fonts, fontSizes, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabaseAuth';

export default function Settings() {
  const router = useRouter();
  const { profile } = useAuth();

  // State for toggles
  const [reduceMotion, setReduceMotion] = useState(false);
  const [envImpact, setEnvImpact] = useState(true);
  const [businessInsights, setBusinessInsights] = useState(false);

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
        { icon: Award, label: 'Manage Subscription', color: colors.primary, destructive: false, onPress: () => router.push('/subscription') },
        { icon: RefreshCw, label: 'Restore Purchases', color: colors.primary, destructive: false, onPress: () => Alert.alert('Restore Purchases', 'This feature will be available soon!') },
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
  ];

  return (
    <View style={styles.container}>
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
        <View style={[styles.profilePicture, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
          {profile?.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.profileImage}
            />
          ) : (
            <Text style={{ fontSize: 16, fontFamily: fonts.sansBold, color: colors.primaryForeground }}>
              {getInitials(profile?.full_name || profile?.email)}
            </Text>
          )}
        </View>
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
                    onPress={item.onPress}
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

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.card}>
            <Pressable style={[styles.settingItem, styles.settingItemBorder]}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                  <Palette size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>App Theme</Text>
                  <Text style={styles.settingSubtitle}>Light, Dark, or System</Text>
                </View>
              </View>
              <View style={styles.settingItemRight}>
                <Text style={styles.settingValue}>System</Text>
                <ChevronRight size={20} color={colors.mutedForeground} />
              </View>
            </Pressable>
            <View style={styles.settingItem}>
              <View style={styles.settingItemLeft}>
                <View style={styles.iconContainer}>
                  <Wind size={24} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Reduce Motion</Text>
                  <Text style={styles.settingSubtitle}>Minimize animations</Text>
                </View>
              </View>
              <Switch
                value={reduceMotion}
                onValueChange={setReduceMotion}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
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
                <Text style={styles.settingLabel}>Environmental impact indicators</Text>
              </View>
              <Switch
                value={envImpact}
                onValueChange={setEnvImpact}
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
                onValueChange={setBusinessInsights}
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

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
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
