import { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    TextInput,
    Alert,
    ActivityIndicator,
    Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft,
    Camera,
    X,
    CheckCircle,
    ShieldCheck,
    Check,
    Info,
    AlertTriangle
} from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseAuth';

export default function AddFamilyMember() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user } = useAuth();
    const params = useLocalSearchParams();
    const memberId = params.memberId;
    const isEditMode = !!memberId;

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [ageGroup, setAgeGroup] = useState('child');
    const [allergens, setAllergens] = useState([]);
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(isEditMode);

    // V4: Cosmetic personalization for family members (feature parity)
    const [skinType, setSkinType] = useState('normal');
    const [skinConditions, setSkinConditions] = useState([]);
    const [sensitivityLevel, setSensitivityLevel] = useState('standard');
    const [isPregnant, setIsPregnant] = useState(false);
    const [isBreastfeeding, setIsBreastfeeding] = useState(false);
    const [cosmeticAllergens, setCosmeticAllergens] = useState([]);
    const [allergenSeverity, setAllergenSeverity] = useState({});

    // Helper: Age Group Calculator
    const getAgeGroup = (ageVal) => {
        const num = parseInt(ageVal, 10);
        if (isNaN(num) || num < 0) return 'adult';
        if (num <= 2) return 'infant';
        if (num <= 12) return 'child';
        return 'adult';
    };

    // Update age group when age changes
    useEffect(() => {
        if (age) {
            setAgeGroup(getAgeGroup(age));
        }
    }, [age]);

    const getAllergenSeverity = (allergen) => {
        return allergenSeverity[allergen] || { severity: 'moderate', avoid_always: false };
    };

    const updateAllergenSeverity = (allergen, field, value) => {
        setAllergenSeverity(prev => ({
            ...prev,
            [allergen]: {
                ...getAllergenSeverity(allergen),
                [field]: value
            }
        }));
    };

    // Fetch member data if editing
    useEffect(() => {
        if (isEditMode) {
            loadMemberData();
        }
    }, [memberId]);

    const loadMemberData = async () => {
        const { data, error } = await supabase
            .from('family_members')
            .select('*')
            .eq('id', memberId)
            .single();

        if (error) {
            console.error('[AddFamilyMember] Load error:', error);
            Alert.alert('Error', 'Failed to load family member data');
            router.back();
        } else {
            setName(data.name || '');
            if (data.age_years) {
                setAge(data.age_years.toString());
            } else {
                setAgeGroup(data.age_group || 'child');
            }
            setAllergens(data.allergies || []);
            setDietaryPrefs(data.dietary_restrictions || []);
            setAvatarUrl(data.avatar_url);

            // V4: Load cosmetic fields
            setSkinType(data.skin_type || 'normal');
            setSkinConditions(data.skin_conditions || []);
            setSensitivityLevel(data.sensitivity_level || 'standard');
            setIsPregnant(data.is_pregnant || false);
            setIsBreastfeeding(data.is_breastfeeding || false);
            setCosmeticAllergens(data.cosmetic_allergens || []);
            setAllergenSeverity(data.allergen_severity || {});
        }
        setLoading(false);
    };

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[AddFamilyMember] Image picker error:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadAvatar = async (uri) => {
        setUploadingImage(true);
        try {
            const fileExt = uri.split('.').pop().toLowerCase();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            const response = await fetch(uri);
            const arrayBuffer = await response.arrayBuffer();

            const { error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, arrayBuffer, {
                    contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
        } catch (error) {
            console.error('[AddFamilyMember] Upload error:', error);
            Alert.alert('Error', 'Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter a name');
            return;
        }

        console.log(`[AddFamilyMember] ${isEditMode ? 'Updating' : 'Creating'}...`, { name, ageGroup, allergens, dietaryPrefs });
        setSaving(true);

        try {
            // Add timeout to prevent indefinite spinning
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Save operation timed out')), 15000)
            );

            let dbPromise;
            if (isEditMode) {
                // UPDATE existing member
                dbPromise = supabase
                    .from('family_members')
                    .update({
                        name: name.trim(),
                        age_group: ageGroup,
                        age_years: parseInt(age, 10) || 0,
                        allergies: allergens,
                        dietary_restrictions: dietaryPrefs,
                        avatar_url: avatarUrl,
                        // V4: Cosmetic fields
                        skin_type: skinType,
                        skin_conditions: skinConditions,
                        sensitivity_level: sensitivityLevel,
                        is_pregnant: isPregnant,
                        is_breastfeeding: isBreastfeeding,
                        cosmetic_allergens: cosmeticAllergens,
                        allergen_severity: allergenSeverity,
                    })
                    .eq('id', memberId)
                    .select();
            } else {
                // INSERT new member
                dbPromise = supabase
                    .from('family_members')
                    .insert({
                        user_id: user.id,
                        name: name.trim(),
                        age_group: ageGroup,
                        age_years: parseInt(age, 10) || 0,
                        allergies: allergens,
                        dietary_restrictions: dietaryPrefs,
                        avatar_url: avatarUrl,
                        // V4: Cosmetic fields
                        skin_type: skinType,
                        skin_conditions: skinConditions,
                        sensitivity_level: sensitivityLevel,
                        is_pregnant: isPregnant,
                        is_breastfeeding: isBreastfeeding,
                        cosmetic_allergens: cosmeticAllergens,
                        allergen_severity: allergenSeverity,
                    })
                    .select();
            }

            const { data, error } = await Promise.race([dbPromise, timeoutPromise]);

            if (error) throw error;

            console.log('[AddFamilyMember] Success:', data);
            Alert.alert('Success', `${name} ${isEditMode ? 'updated' : 'added'} successfully!`, [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (error) {
            console.error('[AddFamilyMember] Error:', error);
            const msg = error.message || 'Unknown error occurred';

            // Check for specific Supabase errors
            if (msg.includes('duplicate key')) {
                Alert.alert('Error', 'A family member with this name already exists.');
            } else if (msg.includes('timeout')) {
                Alert.alert('Error', 'Request timed out. Please check your connection.');
            } else {
                Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'add'} family member: ${msg}`);
            }
        } finally {
            setSaving(false);
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

    const toggleCosmeticAllergen = (allergen) => {
        setCosmeticAllergens((prev) =>
            prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
        );
    };

    const toggleSkinCondition = (condition) => {
        setSkinConditions((prev) =>
            prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
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
                <Text style={styles.headerTitle}>{isEditMode ? 'Edit' : 'Add'} Family Member</Text>
                <View style={styles.headerSpacer} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
                    <View style={styles.avatarSection}>
                        <View style={styles.avatarContainer}>
                            <Pressable onPress={handleImagePick}>
                                {uploadingImage ? (
                                    <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                                        <ActivityIndicator color={colors.primary} />
                                    </View>
                                ) : avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatar}>
                                        <Text style={styles.avatarText}>
                                            {name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>
                            <Pressable style={styles.cameraButton} onPress={handleImagePick}>
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
                            <Text style={styles.label}>Age (results need exact age)</Text>
                            <TextInput
                                style={styles.input}
                                value={age}
                                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                                placeholder="Enter age in years"
                                placeholderTextColor={colors.mutedForeground}
                                keyboardType="numeric"
                                maxLength={3}
                            />
                            {ageGroup && (
                                <Text style={[styles.prefSubtitle, { marginTop: 8, paddingHorizontal: 4 }]}>
                                    Grouping: {ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)} (calculated)
                                </Text>
                            )}
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

                        {/* V4: Allergy Severity Settings */}
                        {allergens.length > 0 && (
                            <View style={styles.severitySection}>
                                <Text style={styles.severitySectionTitle}>Allergy Severity</Text>
                                {allergens.map((allergy) => {
                                    const severity = getAllergenSeverity(allergy);
                                    return (
                                        <View key={allergy} style={styles.severityItem}>
                                            <Text style={styles.severityAllergenName}>{allergy}</Text>
                                            <View style={styles.severityRow}>
                                                {['mild', 'moderate', 'severe'].map((level) => (
                                                    <Pressable
                                                        key={level}
                                                        style={[
                                                            styles.severityOption,
                                                            severity.severity === level && styles.severityOptionActive,
                                                            level === 'severe' && severity.severity === level && styles.severityOptionSevere
                                                        ]}
                                                        onPress={() => updateAllergenSeverity(allergy, 'severity', level)}
                                                    >
                                                        <Text style={[
                                                            styles.severityOptionText,
                                                            severity.severity === level && styles.severityOptionTextActive
                                                        ]}>
                                                            {level.charAt(0).toUpperCase() + level.slice(1)}
                                                        </Text>
                                                    </Pressable>
                                                ))}
                                            </View>
                                            <Pressable
                                                style={styles.avoidAlwaysRow}
                                                onPress={() => updateAllergenSeverity(allergy, 'avoid_always', !severity.avoid_always)}
                                            >
                                                <View style={[styles.avoidCheckbox, severity.avoid_always && styles.avoidCheckboxActive]}>
                                                    {severity.avoid_always && <Check size={12} color="#fff" />}
                                                </View>
                                                <Text style={styles.avoidAlwaysText}>Always avoid (never just flag)</Text>
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
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

                    {/* V4: Skin & Beauty Preferences */}
                    {/* Cosmetic Personalization Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>BEAUTY PREFERENCES</Text>
                    </View>

                    {/* Pregnancy/Breastfeeding Status */}
                    <View style={styles.prefCard}>
                        <View style={styles.prefHeader}>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Text style={styles.prefTitle}>Pregnancy & Nursing</Text>
                                    <Pressable
                                        onPress={() => Alert.alert(
                                            "Why This Matters",
                                            "During pregnancy and breastfeeding, certain ingredients can be absorbed through the skin or ingested and may affect the baby.\n\nWe flag:\n• Retinoids (Vitamin A derivatives)\n• Salicylic acid in high doses\n• Certain essential oils\n• Chemical sunscreen ingredients\n• Parabens and phthalates\n\nThis helps you make safer choices for you and your baby.",
                                            [{ text: "Got it" }]
                                        )}
                                        style={{ padding: 4 }}
                                    >
                                        <Info size={16} color={colors.mutedForeground} />
                                    </Pressable>
                                </View>
                                <Text style={styles.prefSubtitle}>We'll flag ingredients to avoid</Text>
                            </View>
                        </View>
                        <View style={styles.tagContainer}>
                            <Pressable
                                style={[styles.tag, isPregnant && styles.tagActiveSpecial]}
                                onPress={() => setIsPregnant(!isPregnant)}
                            >
                                <Text style={[styles.tagText, isPregnant && styles.tagTextActiveSpecial]}>
                                    Pregnant
                                </Text>
                                {isPregnant && <X size={14} color={colors.destructive} />}
                            </Pressable>
                            <Pressable
                                style={[styles.tag, isBreastfeeding && styles.tagActiveSpecial]}
                                onPress={() => setIsBreastfeeding(!isBreastfeeding)}
                            >
                                <Text style={[styles.tagText, isBreastfeeding && styles.tagTextActiveSpecial]}>
                                    Breastfeeding
                                </Text>
                                {isBreastfeeding && <X size={14} color={colors.destructive} />}
                            </Pressable>
                        </View>
                    </View>

                    {/* Skin Type */}
                    <View style={styles.prefCard}>
                        <View style={styles.prefHeader}>
                            <View>
                                <Text style={styles.prefTitle}>Skin Type</Text>
                                <Text style={styles.prefSubtitle}>Helps us adjust sensitivity scores</Text>
                            </View>
                        </View>
                        <View style={styles.tagContainer}>
                            {['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'].map((type) => (
                                <Pressable
                                    key={type}
                                    style={[styles.tag, skinType === type.toLowerCase() && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}
                                    onPress={() => setSkinType(type.toLowerCase())}
                                >
                                    <Text style={[styles.tagText, skinType === type.toLowerCase() && { color: colors.primary }]}>
                                        {type}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.prefCard}>
                        <View style={styles.prefHeader}>
                            <View>
                                <Text style={styles.prefTitle}>Skin Concerns</Text>
                                <Text style={styles.prefSubtitle}>Optional — helps flag relevant ingredients</Text>
                            </View>
                        </View>
                        <View style={styles.tagContainer}>
                            {['Acne', 'Eczema', 'Rosacea', 'Psoriasis', 'Hyperpigmentation', 'Aging'].map((condition) => (
                                <Pressable
                                    key={condition}
                                    style={[styles.tag, skinConditions.includes(condition.toLowerCase()) && styles.tagActive]}
                                    onPress={() => toggleSkinCondition(condition.toLowerCase())}
                                >
                                    <Text style={[styles.tagText, skinConditions.includes(condition.toLowerCase()) && styles.tagTextActive]}>
                                        {condition}
                                    </Text>
                                    {skinConditions.includes(condition.toLowerCase()) && <X size={14} color={colors.chart3} />}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Cosmetic Allergens */}
                    <View style={styles.prefCard}>
                        <View style={styles.prefHeader}>
                            <View>
                                <Text style={styles.prefTitle}>Known Cosmetic Allergens</Text>
                                <Text style={styles.prefSubtitle}>EU fragrance allergens you react to</Text>
                            </View>
                        </View>
                        <View style={styles.tagContainer}>
                            {['linalool', 'limonene', 'citral', 'geraniol', 'citronellol', 'eugenol', 'coumarin', 'benzyl alcohol'].map((allergen) => (
                                <Pressable
                                    key={allergen}
                                    style={[styles.tag, cosmeticAllergens.includes(allergen) && styles.tagActiveAllergen]}
                                    onPress={() => toggleCosmeticAllergen(allergen)}
                                >
                                    <Text style={[styles.tagText, cosmeticAllergens.includes(allergen) && styles.tagTextActiveAllergen]}>
                                        {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                                    </Text>
                                    {cosmeticAllergens.includes(allergen) && <X size={14} color={colors.destructive} />}
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.prefCard}>
                        <View style={styles.prefHeader}>
                            <Text style={styles.prefTitle}>Sensitivity Level</Text>
                            <Text style={styles.prefSubtitle}>Adjusts warning thresholds</Text>
                        </View>
                        <View style={styles.sensitivityContainer}>
                            {[
                                { key: 'standard', label: 'Standard', icon: 'check', desc: 'Balanced recommendations' },
                                { key: 'cautious', label: 'Cautious', icon: 'alert', desc: 'More warnings shown' },
                                { key: 'sensitive', label: 'Sensitive', icon: 'shield', desc: 'Strictest analysis' },
                            ].map((s) => (
                                <Pressable
                                    key={s.key}
                                    style={[styles.sensitivityOption, sensitivityLevel === s.key && styles.sensitivityOptionActive]}
                                    onPress={() => setSensitivityLevel(s.key)}
                                >
                                    {s.icon === 'check' && <CheckCircle size={24} color={sensitivityLevel === s.key ? colors.primary : colors.mutedForeground} />}
                                    {s.icon === 'alert' && <AlertTriangle size={24} color={sensitivityLevel === s.key ? colors.chart2 : colors.mutedForeground} />}
                                    {s.icon === 'shield' && <ShieldCheck size={24} color={sensitivityLevel === s.key ? colors.chart3 : colors.mutedForeground} />}
                                    <View style={styles.sensitivityInfo}>
                                        <Text style={[styles.sensitivityLabel, sensitivityLevel === s.key && styles.sensitivityLabelActive]}>
                                            {s.label}
                                        </Text>
                                        <Text style={styles.sensitivityDesc}>{s.desc}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            )
            }

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving || !name.trim()}>
                    <Text style={styles.saveButtonText}>
                        {saving ? (isEditMode ? 'Saving...' : 'Adding...') : (isEditMode ? 'Save Changes' : 'Add Family Member')}
                    </Text>
                </Pressable>
            </View>
        </View >
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
        fontFamily: fonts.heading,
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        fontFamily: fonts.heading,
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
    // New styles for V4 features
    severitySection: { marginTop: spacing[4], paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: colors.border },
    severitySectionTitle: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.foreground, marginBottom: spacing[3] },
    severityItem: { marginBottom: spacing[4] },
    severityAllergenName: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.foreground, marginBottom: spacing[2] },
    severityRow: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[2] },
    severityOption: { flex: 1, alignItems: 'center', paddingVertical: spacing[3], borderRadius: radius.xl, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    severityOptionActive: { backgroundColor: `${colors.chart2}15`, borderColor: colors.chart2 },
    severityOptionSevere: { backgroundColor: `${colors.chart3}15`, borderColor: colors.chart3 },
    severityOptionText: { fontSize: 12, fontFamily: fonts.sansMedium, color: colors.mutedForeground },
    severityOptionTextActive: { color: colors.foreground, fontFamily: fonts.sansBold },
    avoidAlwaysRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 2 },
    avoidCheckbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    avoidCheckboxActive: { backgroundColor: colors.chart3, borderColor: colors.chart3 },
    avoidAlwaysText: { fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground },

    sensitivityContainer: { gap: spacing[3] },
    sensitivityOption: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], padding: spacing[4], borderRadius: radius['2xl'], backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
    sensitivityOptionActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
    sensitivityInfo: { flex: 1 },
    sensitivityLabel: { fontSize: 16, fontFamily: fonts.sansBold, color: colors.foreground },
    sensitivityLabelActive: { color: colors.primary },
    sensitivityDesc: { fontSize: 13, fontFamily: fonts.sans, color: colors.mutedForeground, marginTop: 2 },

    tagActiveSpecial: { backgroundColor: `${colors.accent}20`, borderColor: colors.accent },
    tagTextActiveSpecial: { color: colors.accent },
    tagActiveAllergen: { backgroundColor: `${colors.destructive}15`, borderColor: colors.destructive },
    tagTextActiveAllergen: { color: colors.destructive },
    tagActiveSkin: { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
    tagTextActiveSkin: { color: colors.primary },
});
