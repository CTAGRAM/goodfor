import { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Calendar,
  ChevronDown,
  Box,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  PackageOpen
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function History() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadScans();
    }
  }, [profile]);

  const loadScans = async () => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScans(data || []);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupScansByDate = (scans) => {
    const grouped = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    scans.forEach(scan => {
      const scanDate = new Date(scan.created_at);
      let label;

      if (scanDate.toDateString() === today.toDateString()) {
        label = 'Today';
      } else if (scanDate.toDateString() === yesterday.toDateString()) {
        label = 'Yesterday';
      } else {
        label = scanDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }

      if (!grouped[label]) {
        grouped[label] = [];
      }
      grouped[label].push(scan);
    });

    return Object.entries(grouped).map(([section, items]) => ({ section, items }));
  };

  const getSafetyColor = (safety) => {
    switch (safety) {
      case "safe":
        return colors.chart1;
      case "caution":
        return colors.chart2;
      case "avoid":
        return colors.chart3;
      default:
        return colors.chart1;
    }
  };

  const getSafetyIcon = (safety) => {
    switch (safety) {
      case "safe":
        return CheckCircle;
      case "caution":
        return Info;
      case "avoid":
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  const historyData = groupScansByDate(scans);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Decorative Background Blurs */}
      <View style={styles.blurTopRight} />
      <View style={styles.blurLeft} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan History</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Calendar size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : scans.length === 0 ? (
        // Empty state
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${colors.accent}40`,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24
          }}>
            <PackageOpen size={40} color={colors.mutedForeground} />
          </View>
          <Text style={{
            fontSize: 24,
            fontFamily: fonts.heading.bold,
            color: colors.foreground,
            marginBottom: 12,
            textAlign: 'center'
          }}>
            No Scans Yet
          </Text>
          <Text style={{
            fontSize: 16,
            color: colors.mutedForeground,
            textAlign: 'center',
            lineHeight: 24
          }}>
            Scan your first product to start tracking your family's safety history
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {historyData.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{group.section}</Text>
              <View style={styles.sectionContent}>
                {group.items.map((item, itemIndex) => {
                  const SafetyIcon = getSafetyIcon(item.safety_level);
                  const safetyColor = getSafetyColor(item.safety_level);
                  const time = new Date(item.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.historyItem,
                        itemIndex !== group.items.length - 1 && styles.historyItemBorder,
                      ]}
                    >
                      <View style={styles.historyItemLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: `${safetyColor}20` }]}>
                          <SafetyIcon size={24} color={safetyColor} />
                        </View>
                        <View style={styles.historyItemInfo}>
                          <Text style={styles.productName}>{item.product_name || 'Unknown Product'}</Text>
                          <View style={styles.metaRow}>
                            <Text style={styles.timeText}>{time}</Text>
                            {item.scanned_for && (
                              <>
                                <View style={styles.metaDot} />
                                <Text style={styles.userName}>{item.scanned_for}</Text>
                              </>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.historyItemRight}>
                        <View
                          style={[
                            styles.safetyBadge,
                            { backgroundColor: `${safetyColor}20` },
                          ]}
                        >
                          <Text
                            style={[
                              styles.safetyBadgeText,
                              { color: safetyColor },
                            ]}
                          >
                            {item.safety_label || item.safety_level?.toUpperCase()}
                          </Text>
                        </View>
                        <ChevronRight size={20} color={colors.mutedForeground} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    position: "relative",
    overflow: "hidden",
  },

  blurTopRight: {
    position: "absolute",
    top: -128,
    right: -128,
    width: 256,
    height: 256,
    backgroundColor: colors.accent,
    borderRadius: 128,
    opacity: 0.4,
  },
  blurLeft: {
    position: "absolute",
    top: "25%",
    left: -96,
    width: 192,
    height: 192,
    backgroundColor: colors.chart1,
    borderRadius: 96,
    opacity: 0.05,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius["2xl"],
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.heading.bold,
    color: colors.foreground,
  },
  headerRight: {
    flexDirection: "row",
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius["2xl"],
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },

  section: {
    marginBottom: spacing[8],
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.sans.bold,
    color: colors.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  sectionContent: {
    backgroundColor: colors.card,
    borderRadius: radius["3xl"],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },

  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing[4],
  },
  historyItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.border}40`,
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius["2xl"],
    alignItems: "center",
    justifyContent: "center",
  },
  historyItemInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontFamily: fonts.sans.semiBold,
    color: colors.foreground,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  timeText: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.mutedForeground,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.mutedForeground,
  },
  userName: {
    fontSize: 12,
    fontFamily: fonts.sans.regular,
    color: colors.mutedForeground,
  },
  historyItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  safetyBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.lg,
  },
  safetyBadgeText: {
    fontSize: 10,
    fontFamily: fonts.sans.bold,
    letterSpacing: 0.5,
  },
});
