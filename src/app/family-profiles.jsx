import { useState, useEffect } from '
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Info,
    Edit,
    UserPlus,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseAuth';

export default function FamilyProfiles() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, profile } = useAuth();

    const [familyMembers, setFamilyMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFamilyMembers();
    }, []);

    const loadFamilyMembers = async () => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Failed to load family members:', error);
        } else {
            setFamilyMembers(data || []);
        }
        setLoading(false);
    };

    const handleAddMember = () => {
        // TODO: Navigate to add family member screen
        Alert.alert('Coming Soon', 'Add family member feature will be available soon!');
    };

    return (
        <View style={styles.container}>
            <StatusBar style=\"dark\" />
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.headerButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Family Profiles</Text>
                </View>
                <Pressable style={styles.infoButton}>
                    <Info size={24} color={colors.primary} />
                </Pressable>
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
                <Text style={styles.introText}>
                    Manage individual dietary needs and preferences for everyone in your family to get personalized product recommendations.
                </Text>

                {/* Current User Profile */}
                <View style={styles.profileCard}>
                    <View style={styles.profileLeft}>
                        <View style={styles.avatarPrimary}>
                            <Text style={styles.avatarText}>
                                {profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.profileName}>{profile?.full_name || 'You'}</Text>
                            <Text style={styles.profileBadge}>
                                {(profile?.age_group || 'adult').toUpperCase()}
                            </Text>
                            <View style={styles.tagRow}>
                                {profile?.dietary_preferences?.slice(0, 2).map((pref, i) => (
                                    <View key={i} style={styles.tagSmall}>
                                        <Text style={styles.tagSmallText}>{pref}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                    <Pressable style={styles.editButton} onPress={() => router.push('/edit-profile')}>
                        <Edit size={20} color={colors.mutedForeground} />
                    </Pressable>
                </View>

                {/* Family Members */}
                {familyMembers.map((member) => (
                    <View key={member.id} style={styles.profileCard}>
                        <View style={styles.profileLeft}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={styles.profileName}>{member.name}</Text>
                                <Text style={styles.profileBadge}>
                                    {(member.age_group || 'child').toUpperCase()}
                                </Text>
                                <View style={styles.tagRow}>
                                    {member.allergies?.slice(0, 2).map((allergy, i) => (
                                        <View key={i} style={[styles.tagSmall, styles.tagAllergy]}>
                                            <Text style={styles.tagAllergyText}>{allergy}</Text>
                                        </View>
                                    ))}
                                    {member.dietary_restrictions?.slice(0, 1).map((pref, i) => (
                                        <View key={i} style={styles.tagSmall}>
                                            <Text style={styles.tagSmallText}>{pref}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        </View>
                        <Pressable style={styles.editButton}>
                            <Edit size={20} color={colors.mutedForeground} />
                        </Pressable>
                    </View>
                ))}

                {/* Empty State */}
                {familyMembers.length === 0 && !loading && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No family members added yet</Text>
                    </View>
                )}

                {/* Add Button */}
                <Pressable style={styles.addButton} onPress={handleAddMember}>
                    <UserPlus size={24} color={colors.primaryForeground} />
                    <Text style={styles.addButtonText}>Add Family Member</Text>
                </Pressable>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Want better results?</Text>
                    <Text style={styles.infoText}>
                        Adding more detailed restrictions helps us find the healthiest choices specifically for your family.
                    </Text>
                </View>
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
    blurBottom: {
        position: 'absolute',
        bottom: 100,
        left: -96,
        width: 192,
        height: 192,
        backgroundColor: colors.chart1,
        opacity: 0.05,
        borderRadius: 96,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[4],
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
    },
    infoButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    main: {
        flex: 1,
    },
    mainContent: {
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[32],
    },
    introText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 20,
        marginBottom: spacing[6],
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[5],
        borderWidth: 1,
        borderColor: `${colors.border}33`,
        marginBottom: spacing[4],
    },
    profileLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[4],
        flex: 1,
    },
    avatarPrimary: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.accent,
        borderWidth: 2,
        borderColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.secondary,
        borderWidth: 2,
        borderColor: `${colors.chart2}33`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontFamily: fonts.sansExtraBold,
        color: colors.primary,
    },
    profileName: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    profileBadge: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        letterSpacing: 1,
        marginTop: 2,
    },
    tagRow: {
        flexDirection: 'row',
        gap: spacing[1.5],
        marginTop: spacing[2],
        flexWrap: 'wrap',
    },
    tagSmall: {
        paddingHorizontal: spacing[2],
        paddingVertical: 2,
        borderRadius: radius.full,
        backgroundColor: `${colors.accent}4D`,
        borderWidth: 1,
        borderColor: `${colors.accent}80`,
    },
    tagSmallText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    tagAllergy: {
        backgroundColor: `${colors.chart3}1A`,
        borderColor: `${colors.chart3}33`,
    },
    tagAllergyText: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.chart3,
    },
    editButton: {
        padding: spacing[2],
    },
    emptyState: {
        paddingVertical: spacing[12],
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[3],
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius['2xl'],
        marginTop: spacing[4],
    },
    addButtonText: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    infoCard: {
        marginTop: spacing[12],
        padding: spacing[6],
        backgroundColor: `${colors.accent}20`,
        borderRadius: radius['3xl'],
        borderWidth: 1,
        borderColor: `${colors.accent}4D`,
        alignItems: 'center',
    },
    infoTitle: {
        fontSize: 16,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    infoText: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        textAlign: 'center',
        lineHeight: 20,
    },
});
