import { useState, useEffect } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Users,
  User,
  PlusCircle,
  ChevronDown,
  Info,
  CheckCircle,
  AlertTriangle,
} from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function Home() {
  const insets = useSafeAreaInsets();
  const { profile, loading: profileLoading } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(true);

  useEffect(() => {
    if (profile) {
      loadFamilyMembers();
    }
  }, [profile]);

  const loadFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('Error loading family members:', error);
    } finally {
      setLoadingFamily(false);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (profileLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Background blurs */}
      <View
        style={{
          position: "absolute",
          top: -128,
          right: -128,
          width: 256,
          height: 256,
          backgroundColor: colors.accent,
          opacity: 0.4,
          borderRadius: 128,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 200,
          left: -96,
          width: 192,
          height: 192,
          backgroundColor: colors.chart1,
          opacity: 0.05,
          borderRadius: 96,
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Image
          source={{
            uri: "https://ggrhecslgdflloszjkwl.supabase.co/storage/v1/object/public/user-assets/onAkNUUAGm7/ai/GoodFor-1-x16DQfFL43Z.png",
          }}
          style={{ width: 120, height: 32 }}
          resizeMode="contain"
        />
        <View style={{ position: "relative" }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: colors.card,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text style={{ fontSize: 18, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                {getInitials(profile?.full_name || profile?.email)}
              </Text>
            )}
          </View>
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              backgroundColor: colors.chart1,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: colors.card,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{ width: 6, height: 6, backgroundColor: colors.card }}
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 16,
              color: colors.mutedForeground,
              marginBottom: 4,
            }}
          >
            {getGreeting()},
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontFamily: "Rubik_800ExtraBold",
              color: colors.foreground,
            }}
          >
            {profile?.full_name || profile?.email?.split('@')[0] || 'User'}
          </Text>
        </View>

        {/* Active Profiles Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            marginBottom: 32,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background blur */}
          <View
            style={{
              position: "absolute",
              top: -64,
              right: -64,
              width: 128,
              height: 128,
              backgroundColor: colors.accent,
              opacity: 0.3,
              borderRadius: 64,
            }}
          />

          <View style={{ position: "relative", zIndex: 10 }}>
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Rubik_700Bold",
                marginBottom: 16,
              }}
            >
              Active Profiles
            </Text>

            {loadingFamily ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : familyMembers.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              >
                {familyMembers.map((member) => (
                  <View key={member.id} style={{ alignItems: "center", gap: 8, minWidth: 80 }}>
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        borderWidth: 2,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                        {getInitials(member.name)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: "Rubik_600SemiBold",
                          color: colors.foreground,
                        }}
                      >
                        {member.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: colors.mutedForeground,
                        }}
                      >
                        {member.age_group || 'Adult'}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Add Profile Button */}
                <View style={{ alignItems: "center", gap: 8, minWidth: 80 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 2,
                      borderColor: colors.border,
                      borderStyle: "dashed",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: colors.secondary,
                    }}
                  >
                    <PlusCircle size={24} color={colors.mutedForeground} />
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                    }}
                  >
                    Add Profile
                  </Text>
                </View>
              </ScrollView>
            ) : (
              // Empty state
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Users size={32} color={colors.mutedForeground} />
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
                  No family profiles yet. Add one to get started!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Recent Scans */}
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: "Rubik_700Bold",
                color: colors.foreground,
              }}
            >
              Recent Scans
            </Text>
            <Pressable>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Rubik_600SemiBold",
                  color: colors.primary,
                }}
              >
                View All
              </Text>
            </Pressable>
          </View>

          {/* Empty state for recent scans */}
          <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Info size={32} color={colors.mutedForeground} />
            <Text style={{
              fontSize: 14,
              color: colors.mutedForeground,
              marginTop: 12,
              textAlign: 'center',
            }}>
              Scan your first product to see it here
            </Text>
          </View>
        </View>

        {/* Safety Summary */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontFamily: "Rubik_700Bold",
              marginBottom: 16,
            }}
          >
            Safety Summary
          </Text>

          <View style={{ gap: 12 }}>
            {/* Safe Products */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: colors.card,
                borderRadius: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${colors.chart1}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle size={20} color={colors.chart1} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Rubik_700Bold",
                    color: colors.foreground,
                  }}
                >
                  0
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                  }}
                >
                  Safe Products
                </Text>
              </View>
            </View>

            {/* Warning Products */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                backgroundColor: colors.card,
                borderRadius: 16,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: `${colors.chart3}20`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={20} color={colors.chart3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 24,
                    fontFamily: "Rubik_700Bold",
                    color: colors.foreground,
                  }}
                >
                  0
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                  }}
                >
                  Products to Review
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
