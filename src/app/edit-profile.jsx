import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Image,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Info,
    Camera,
    X,
    Trash2,
    UserPlus,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseAuth';

export default function EditProfile() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { profile, user } = useAuth();

    const [name, setName] = useState('');
    const [ageGroup, setAgeGroup] = useState('adult');
    const [allergens, setAllergens] = useState([]);
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || '');
            setAgeGroup(profile.age_group || 'adult');
            setAllergens(profile.allergens || []);
            setDietaryPrefs(profile.dietary_preferences || []);
        }
    }, [profile]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: name,
                age_group: ageGroup,
                allergens,
                dietary_preferences: dietaryPrefs,
            })
            .eq('id', user.id);

        setSaving(false);

        if (error) {
            Alert.alert('Error', 'Failed to save profile');
        } else {
            Alert.alert('Success', 'Profile updated!');
            router.back();
        }
    };

    const toggleAllergy = (allergy) => {
        setAllergens((prev) =>
            prev.includes(allergy) ? prev.filter((a) => a !== allergy) : [...prev, allergy]
        );
    };

    const toggleDietaryPref = (pref) => {
        setDietaryPrefs((prev) =>
            prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
        );
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
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                </View>
                <Pressable style={styles.infoButton}>
                    <Info size={24} color={colors.primary} />
                </Pressable>
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
                <Pressable
                    style={styles.manageButton}
                    onPress={() => router.push('/family-profiles')}
                >
                    <View style={styles.manageButtonLeft}>
                        <UserPlus size={20} color={colors.primary} />
                        <Text style={styles.manageButtonText}>Manage family</Text>
                    </View>
                    <ArrowLeft size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
                </Pressable>

                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                            </Text>
                        </View>
                        <Pressable style={styles.cameraButton}>
                            <Camera size={16} color={colors.primaryForeground} />
                        </Pressable>
                    </View>
                    <View style={styles.avatarInfo}>
                        <Text style={styles.avatarName}>{name || 'Your Name'}</Text>
                        <Text style={styles.avatarBadge}>{ageGroup.toUpperCase()} PROFILE</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>PROFILE INFO</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder=\"Enter your name\"
                        placeholderTextColor={colors.mutedForeground}
            />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Age Group</Text>
                        <View style={styles.ageButtons}>
                            {['infant', 'child', 'adult'].map((age) => (
                                <Pressable
                                    key={age}
                                    style={[styles.ageButton, ageGroup === age && styles.ageButtonActive]}
                                    onPress={() => setAgeGroup(age)}
                                >
                                    <Text style={[styles.ageButtonText, ageGroup === age && styles.ageButtonTextActive]}>
                                        {age.charAt(0).toUpperCase() + age.slice(1)}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View>
                            <Text style={styles.prefTitle}>Critical Allergies</Text>
                            <Text style={styles.prefSubtitle}>We'll warn you about these ingredients</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {['Nuts', 'Dairy', 'Gluten', 'Soy', 'Eggs', 'Fish'].map((allergy) => (
                            <Pressable
                                key={allergy}
                                style={[styles.tag, allergens.includes(allergy) && styles.tagActive]}
                                onPress={() => toggleAllergy(allergy)}
                            >
                                <Text style={[styles.tagText, allergens.includes(allergy) && styles.tagTextActive]}>
                                    {allergy}
                                </Text>
                                {allergens.includes(allergy) && <X size={14} color={colors.chart3} />}
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View>
                            <Text style={styles.prefTitle}>Dietary Preferences</Text>
                            <Text style={styles.prefSubtitle}>Religious and dietary restrictions</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {['Halal', 'Kosher', 'Vegetarian', 'Vegan', 'Keto', 'Organic'].map((pref) => (
                            <Pressable
                                key={pref}
                                style={[styles.tag, dietaryPrefs.includes(pref) && styles.tagActive]}
                                onPress={() => toggleDietaryPref(pref)}
                            >
                                <Text style={[styles.tagText, dietaryPrefs.includes(pref) && styles.tagTextActive]}>
                                    {pref}
                                </Text>
                                {dietaryPrefs.includes(pref) && <X size={14} color={colors.chart1} />}
                            </Pressable>
                        ))}
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                </Pressable>
            </View>
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
    manageButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing[4],
        borderRadius: radius['2xl'],
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing[6],
    },
    manageButtonLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    manageButtonText: {
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    avatarSection: {
        alignItems: 'center',
        paddingVertical: spacing[6],
        marginBottom: spacing[4],
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.card,
    },
    avatarText: {
        fontSize: 32,
        fontFamily: fonts.sansExtraBold,
        color: colors.primaryForeground,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInfo: {
        marginTop: spacing[3],
        alignItems: 'center',
    },
    avatarName: {
        fontSize: 20,
        fontFamily: fonts.sansExtraBold,
        color: colors.foreground,
    },
    avatarBadge: {
        fontSize: 10,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        letterSpacing: 2,
        marginTop: 2,
    },
    section: {
        marginBottom: spacing[6],
    },
    sectionTitle: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        letterSpacing: 1.5,
        marginBottom: spacing[4],
        paddingHorizontal: spacing[1],
    },
    inputGroup: {
        marginBottom: spacing[4],
    },
    label: {
        fontSize: 14,
        fontFamily: fonts.sansSemiBold,
        color: colors.foreground,
        marginBottom: spacing[2],
        paddingHorizontal: spacing[1],
    },
    input: {
        height: 56,
        backgroundColor: colors.input,
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[5],
        fontSize: 16,
        fontFamily: fonts.sansSemiBold,
        color: colors.foreground,
    },
    ageButtons: {
        flexDirection: 'row',
        gap: spacing[2],
    },
    ageButton: {
        flex: 1,
        paddingVertical: spacing[3],
        borderRadius: radius.xl,
        backgroundColor: colors.card,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
    },
    ageButtonActive: {
        backgroundColor: colors.primary,
    },
    ageButtonText: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    ageButtonTextActive: {
        color: colors.primaryForeground,
    },
    prefCard: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[5],
        borderWidth: 1,
        borderColor: `${colors.border}33`,
        marginBottom: spacing[6],
    },
    prefHeader: {
        marginBottom: spacing[4],
    },
    prefTitle: {
        fontSize: 11,
        fontFamily: fonts.sansBold,
        color: colors.mutedForeground,
        letterSpacing: 1.5,
    },
    prefSubtitle: {
        fontSize: 11,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: 2,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing[2],
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[2],
        borderRadius: radius.full,
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tagActive: {
        backgroundColor: `${colors.chart3}1A`,
        borderColor: `${colors.chart3}33`,
    },
    tagText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    tagTextActive: {
        color: colors.chart3,
    },
    footer: {
        paddingHorizontal: spacing[6],
        paddingTop: spacing[4],
        backgroundColor: `${colors.background}CC`,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius['2xl'],
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 18,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
});
