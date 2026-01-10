import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Camera,
    X,
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseAuth';

export default function AddFamilyMember() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();

    const [name, setName] = useState('');
    const [ageGroup, setAgeGroup] = useState('child');
    const [allergens, setAllergens] = useState([]);
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        console.log('[AddFamilyMember] Creating...', { name, ageGroup, allergens, dietaryPrefs });
        setSaving(true);

        const { data, error } = await supabase
            .from('family_members')
            .insert({
                user_id: user.id,
                name: name.trim(),
                age_group: ageGroup,
                allergies: allergens,
                dietary_restrictions: dietaryPrefs,
            })
            .select();

        setSaving(false);

        if (error) {
            console.error('[AddFamilyMember] Error:', error);
            Alert.alert('Error', `Failed to add family member: ${error.message}`);
        } else {
            console.log('[AddFamilyMember] Created:', data);
            Alert.alert('Success', `${name} added to your family!`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
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
            <StatusBar style="dark" />
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <Pressable style={styles.headerButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.primary} />
                </Pressable>
                <Text style={styles.headerTitle}>Add Family Member</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
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
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>MEMBER INFO</Text>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter family member's name"
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
                        <Text style={styles.prefTitle}>Allergies</Text>
                        <Text style={styles.prefSubtitle}>Select all that apply</Text>
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
                        <Text style={styles.prefTitle}>Dietary Restrictions</Text>
                        <Text style={styles.prefSubtitle}>Optional preferences</Text>
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
                <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving || !name.trim()}>
                    <Text style={styles.saveButtonText}>{saving ? 'Adding...' : 'Add Family Member'}</Text>
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
    headerSpacer: {
        width: 40,
    },
    main: {
        flex: 1,
    },
    mainContent: {
        paddingHorizontal: spacing[6],
        paddingBottom: spacing[32],
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
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.card,
    },
    avatarText: {
        fontSize: 32,
        fontFamily: fonts.sansExtraBold,
        color: colors.primary,
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
