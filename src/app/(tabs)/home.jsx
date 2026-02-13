import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Image, Pressable, ActivityIndicator, TouchableOpacity, Modal } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Users,
  User,
  PlusCircle,
  ChevronDown,
  Info,
  CheckCircle,
  AlertTriangle,
  Edit2,
  UserCheck,
  X,
} from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, activeFamilyMember, switchProfile, loading: profileLoading } = useAuth();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loadingFamily, setLoadingFamily] = useState(true);
  const [recentScans, setRecentScans] = useState([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [stats, setStats] = useState({ safe: 0, review: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (profile) {
      loadFamilyMembers();
      loadRecentScans();
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        loadFamilyMembers();
        loadRecentScans();
      }
    }, [profile])
  );

  const loadFamilyMembers = async () => {
    try {
      console.log('[Home] Loading family members...');
      // Add timeout to prevent indefinite spinning
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Family load timeout')), 10000)
      );

      const queryPromise = supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) throw error;
      console.log('[Home] Family members loaded:', data?.length);
      setFamilyMembers(data || []);
    } catch (error) {
      console.error('[Home] Error loading family members:', error);
    } finally {
      setLoadingFamily(false);
    }
  };

  const loadRecentScans = async () => {
    try {
      console.log('[Home] Loading recent scans...');
      setLoadingScans(true);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Scans load timeout')), 10000)
      );

      let query = supabase
        .from('scans')
        .select(`
          *,
          products (
            name,
            brand,
            image_url,
            category
          )
        `)
        .eq('user_id', profile.id);

      // Filter by active family member
      if (activeFamilyMember) {
        query = query.eq('family_member_id', activeFamilyMember.id);
      } else {
        query = query.is('family_member_id', null);
      }

      const { data, error } = await Promise.race([
        query.order('scanned_at', { ascending: false }),
        timeoutPromise
      ]);

      if (error) throw error;

      console.log('[Home] Scans loaded:', data?.length);

      const formatted = (data || []).map(scan => ({
        ...scan,
        product_name: scan.products?.name,
        product_brand: scan.products?.brand,
        product_image: scan.products?.image_url,
      }));

      setRecentScans(formatted.slice(0, 5)); // Top 5 for home

      // Calculate stats
      const safeCount = formatted.filter(s => s.safety_level === 'safe').length;
      const reviewCount = formatted.filter(s => s.safety_level === 'caution' || s.safety_level === 'avoid').length;

      setStats({ safe: safeCount, review: reviewCount });

    } catch (err) {
      console.error('[Home] Error loading scans:', err);
    } finally {
      setLoadingScans(false);
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

  const displayProfile = activeFamilyMember ? {
    name: activeFamilyMember.name,
    avatar: activeFamilyMember.avatar_url,
    isFamily: true,
    id: activeFamilyMember.id
  } : {
    name: profile?.full_name || profile?.email?.split('@')[0] || 'User',
    avatar: profile?.avatar_url,
    isFamily: false,
    id: profile?.id
  };

  const handleProfilePress = (member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  const handleSwitchProfile = async () => {
    setModalVisible(false);
    if (selectedMember) {
      if (activeFamilyMember?.id === selectedMember.id) return; // Already active
      await switchProfile(selectedMember.id);
    }
  };

  const handleEditProfile = () => {
    setModalVisible(false);
    if (selectedMember) {
      // V4 FIX: Route main user to edit-profile, family members to add-family-member
      if (selectedMember.isMain) {
        router.push('/edit-profile');
      } else {
        router.push({
          pathname: '/add-family-member',
          params: { memberId: selectedMember.id }
        });
      }
    }
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
          <TouchableOpacity
            onPress={() => displayProfile.isFamily
              ? router.push({ pathname: '/add-family-member', params: { memberId: displayProfile.id } })
              : router.push('/edit-profile')
            }
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
            {displayProfile.avatar ? (
              <Image
                source={{ uri: displayProfile.avatar }}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <Text style={{ fontSize: 18, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                {getInitials(displayProfile.name)}
              </Text>
            )}
          </TouchableOpacity>
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
            {displayProfile.name}
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Rubik_700Bold",
                }}
              >
                Active Profiles
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/add-family-member')}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlusCircle size={18} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>

            {loadingFamily ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : familyMembers.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 8 }}
              >
                {/* Main Profile */}
                <TouchableOpacity
                  onPress={() => handleProfilePress({ id: 'main', name: profile?.full_name || 'Main', isMain: true })}
                  style={{ alignItems: "center", gap: 8, minWidth: 80 }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: !activeFamilyMember ? colors.primary : colors.muted,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 4,
                      borderWidth: !activeFamilyMember ? 3 : 0,
                      borderColor: colors.primary,
                      overflow: 'hidden'
                    }}
                  >
                    {profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                        {getInitials(profile?.full_name || profile?.email)}
                      </Text>
                    )}
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 12, fontFamily: "Rubik_600SemiBold", color: colors.foreground }}>
                      {profile?.full_name?.split(' ')[0] || 'Me'}
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.mutedForeground }}>
                      Main
                    </Text>
                  </View>
                </TouchableOpacity>

                {familyMembers.map((member) => {
                  const isActive = activeFamilyMember?.id === member.id;
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={() => handleProfilePress(member)}
                      style={{ alignItems: "center", gap: 8, minWidth: 80 }}
                    >
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: isActive ? colors.primary : colors.muted,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: colors.primary,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          borderWidth: isActive ? 3 : 0,
                          borderColor: colors.primary,
                          overflow: 'hidden'
                        }}
                      >
                        {member.avatar_url ? (
                          <Image source={{ uri: member.avatar_url }} style={{ width: '100%', height: '100%' }} />
                        ) : (
                          <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.primaryForeground }}>
                            {getInitials(member.name)}
                          </Text>
                        )}
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
                    </TouchableOpacity>
                  );
                })}

                {/* Add Profile Button */}
                <TouchableOpacity
                  onPress={() => router.push('/add-family-member')}
                  style={{ alignItems: "center", gap: 8, minWidth: 80 }}
                >
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
                </TouchableOpacity>
              </ScrollView>
            ) : (
              // Empty state
              <TouchableOpacity
                onPress={() => router.push('/add-family-member')}
                style={{ alignItems: 'center', paddingVertical: 20 }}
              >
                <Users size={32} color={colors.mutedForeground} />
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' }}>
                  No family profiles yet. Add one to get started!
                </Text>
              </TouchableOpacity>
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
            <TouchableOpacity onPress={() => router.push("/history")}>
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Rubik_600SemiBold",
                  color: colors.primary,
                }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {loadingScans ? (
            <ActivityIndicator color={colors.primary} />
          ) : recentScans.length === 0 ? (
            /* Empty state for recent scans */
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
          ) : (
            <View style={{ gap: 12 }}>
              {recentScans.map((scan) => (
                <TouchableOpacity
                  key={scan.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    padding: 12,
                    borderRadius: 16,
                    gap: 12
                  }}
                  onPress={() => router.push("/history")}
                >
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 8,
                    backgroundColor: colors.border,
                    overflow: 'hidden'
                  }}>
                    {scan.product_image ? (
                      <Image source={{ uri: scan.product_image }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Info size={20} color={colors.mutedForeground} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }} numberOfLines={1}>
                      {scan.product_name || 'Unknown Product'}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                      {new Date(scan.scanned_at).toLocaleDateString()} • {scan.safety_level?.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: scan.safety_level === 'safe' ? colors.chart1 : colors.chart3
                  }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
                  {stats.safe}
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
                  {stats.review}
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

      {/* Profile Action Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={{
              width: '80%',
              backgroundColor: colors.card,
              borderRadius: 24,
              padding: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 10
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Rubik_700Bold', color: colors.foreground }}>
                {selectedMember?.name || 'Profile Actions'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              {/* Switch Profile Option */}
              <TouchableOpacity
                onPress={handleSwitchProfile}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  backgroundColor: (activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                    ? `${colors.primary}10`
                    : colors.background,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: (activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                    ? colors.primary
                    : colors.border
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: (activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                    ? colors.primary
                    : colors.muted,
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  <UserCheck size={20} color={(activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain) ? colors.primaryForeground : colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                    Switch Profile
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    {(activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)
                      ? 'Currently Active'
                      : 'Switch to this profile'}
                  </Text>
                </View>
                {((activeFamilyMember?.id === selectedMember?.id) || (!activeFamilyMember && selectedMember?.isMain)) && (
                  <CheckCircle size={20} color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* Edit Profile Option */}
              <TouchableOpacity
                onPress={handleEditProfile}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  backgroundColor: colors.background,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.secondary}20`, alignItems: 'center', justifyContent: 'center' }}>
                  <Edit2 size={20} color={colors.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontFamily: 'Rubik_600SemiBold', color: colors.foreground }}>
                    Edit Profile
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Update details & settings
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
