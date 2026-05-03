import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Image, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Info, UserPlus, Camera, X, Trash2, Sparkles, Shield, Users, Plus, CheckCircle, ShieldCheck, Check, AlertTriangle } from 'lucide-react-native';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseAuth';
import { useAlert } from "@/contexts/AlertContext";
import { hapticLight } from "@/lib/haptics";

// Helper function to convert age to age group
const getAgeGroup = (age) => {
    const numAge = parseInt(age, 10);
    if (isNaN(numAge) || numAge < 0) return 'adult';
    if (numAge <= 2) return 'infant';
    if (numAge <= 12) return 'child';
    return 'adult';
};

// Helper to get display label for age group
const getAgeGroupLabel = (age) => {
    const group = getAgeGroup(age);
    const labels = {
        infant: 'Infant (0-2)',
        child: 'Child (3-12)',
        adult: 'Adult (13+)'
    };
    return labels[group] || 'Adult';
};

export default function EditProfile() {
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { user, profile, updateProfile: updateAuthProfile } = useAuth();

    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [allergens, setAllergens] = useState([]);
    const [dietaryPrefs, setDietaryPrefs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // Cosmetic personalization fields
    const [skinType, setSkinType] = useState('normal');
    const [skinConditions, setSkinConditions] = useState([]);
    const [cosmeticAllergens, setCosmeticAllergens] = useState([]);
    const [isPregnant, setIsPregnant] = useState(false);
    const [isBreastfeeding, setIsBreastfeeding] = useState(false);
    const [customAllergen, setCustomAllergen] = useState('');
    // Phase 3: Region and Sensitivity Level
    const [region, setRegion] = useState('US');
    const [sensitivityLevel, setSensitivityLevel] = useState('standard');
    // Phase 4: Allergy Severity System
    const [allergenSeverity, setAllergenSeverity] = useState({});
    // V5: Health Goals
    const [healthGoals, setHealthGoals] = useState([]);
    // Onboarding personalisation fields
    const [userAgeGroup, setUserAgeGroup] = useState('');
    const [userGender, setUserGender] = useState('');
    const [dietPreference, setDietPreference] = useState('');
    const [healthConcerns, setHealthConcerns] = useState([]);
    const [processedKnowledge, setProcessedKnowledge] = useState('');
    const [ingredientHabit, setIngredientHabit] = useState('');
    const [referralSource, setReferralSource] = useState('');
    const [infoPreferences, setInfoPreferences] = useState([]);

    // Helper to update allergen severity
    const updateAllergenSeverity = (allergen, field, value) => {
        setAllergenSeverity(prev => ({
            ...prev,
            [allergen]: {
                ...(prev[allergen] || { severity: 'moderate', avoid_always: false }),
                [field]: value
            }
        }));
    };

    // Get severity for an allergen (default: moderate)
    const getAllergenSeverity = (allergen) => {
        return allergenSeverity[allergen] || { severity: 'moderate', avoid_always: false };
    };

    const addCustomAllergen = () => {
        if (!customAllergen.trim()) return;
        const normalized = customAllergen.trim().toLowerCase();
        if (!allergens.includes(normalized)) {
            setAllergens([...allergens, normalized]);
        }
        setCustomAllergen('');
    };

    useEffect(() => {
        if (profile) {
            setName(profile.full_name || '');
            // If profile has age_years, use it; otherwise try to infer from age_group
            if (profile.age_years) {
                setAge(profile.age_years.toString());
            } else if (profile.age_group) {
                // Set a default age based on age_group if no exact age
                const defaultAges = { infant: '1', child: '8', adult: '25' };
                setAge(defaultAges[profile.age_group] || '25');
            }
            setAllergens(profile.allergens || []);
            setDietaryPrefs(profile.dietary_preferences || []);
            setAvatarUrl(profile.avatar_url || null);

            // Load cosmetic personalization fields
            setSkinType(profile.skin_type || 'normal');
            setSkinConditions(profile.skin_conditions || []);
            setCosmeticAllergens(profile.cosmetic_allergens || []);
            setIsPregnant(profile.is_pregnant || false);
            setIsBreastfeeding(profile.is_breastfeeding || false);
            // Load region and sensitivity - Phase 3
            setRegion(profile.region || 'US');
            setSensitivityLevel(profile.sensitivity_level || 'standard');
            // Load allergen severity - Phase 4
            setAllergenSeverity(profile.allergen_severity || {});
            // V5: Load health goals
            setHealthGoals(profile.health_goals || []);
            // Load onboarding preferences
            setUserAgeGroup(profile.user_age_group || '');
            setUserGender(profile.user_gender || '');
            setDietPreference(profile.diet_preference || '');
            setHealthConcerns(profile.health_concerns || []);
            setProcessedKnowledge(profile.processed_knowledge || '');
            setIngredientHabit(profile.ingredient_habit || '');
            setReferralSource(profile.referral_source || '');
            setInfoPreferences(profile.info_preferences || []);
        }
    }, [profile]);

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Permission Required', 'Sorry, we need camera roll permissions to upload photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.7,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadAvatar(result.assets[0].uri);
            }
        } catch (error) {
            console.error('[EditProfile] Image picker error:', error);
            showAlert('Error', 'Failed to pick image');
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

            if (uploadError) {
                console.error('[EditProfile] Supabase upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setAvatarUrl(publicUrl);
            await updateAuthProfile({ avatar_url: publicUrl });
            showAlert('Success', 'Profile picture updated!');
        } catch (error) {
            console.error('[EditProfile] Upload error:', error);
            showAlert('Error', error.message || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            showAlert('Required', 'Please enter your name to complete your profile.');
            return;
        }

        setSaving(true);
        console.log('[EditProfile] handleSave started');

        try {
            const numAge = parseInt(age, 10);
            const ageGroup = getAgeGroup(age);

            const updates = {
                full_name: name,
                age_years: isNaN(numAge) ? null : numAge,
                age_group: ageGroup,
                allergens,
                dietary_preferences: dietaryPrefs,
                // Cosmetic personalization fields
                skin_type: skinType,
                skin_conditions: skinConditions,
                cosmetic_allergens: cosmeticAllergens,
                is_pregnant: isPregnant,
                is_breastfeeding: isBreastfeeding,
                // Phase 3: Region and Sensitivity Level
                region: region,
                sensitivity_level: sensitivityLevel,
                // Phase 4: Allergy Severity
                allergen_severity: allergenSeverity,
                // V5: Health Goals
                health_goals: healthGoals,
                // Onboarding personalisation
                user_age_group: userAgeGroup || null,
                user_gender: userGender || null,
                diet_preference: dietPreference || null,
                health_concerns: healthConcerns,
                processed_knowledge: processedKnowledge || null,
                ingredient_habit: ingredientHabit || null,
                referral_source: referralSource || null,
                info_preferences: infoPreferences,
                is_profile_completed: true, // Mark as complete
            };

            console.log('[EditProfile] Sending updates to AuthContext...');

            // Add timeout race (15 seconds)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Save operation timed out. Please check your connection.')), 15000)
            );

            const updatePromise = updateAuthProfile(updates);

            const { error } = await Promise.race([updatePromise, timeoutPromise]);

            if (error) {
                console.error('[EditProfile] Save reported error:', error);
                throw error;
            }

            console.log('[EditProfile] Save successful');

            // Allow state update to propagate
            if (!profile?.is_profile_completed) {
                showAlert('Welcome!', 'Your profile is ready. Start scanning!', [
                    { text: 'Let\'s Go', onPress: () => router.replace('/(tabs)/home') }
                ]);
            } else {
                showAlert('Success', 'Profile updated!', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            }
        } catch (err) {
            console.error('[EditProfile] Save execution error:', err);
            showAlert('Error', `Failed to save profile: ${err.message || 'Unknown error'}`);
        } finally {
            // Check if mounted before setting state if possible, but hooks handle this gracefully in newer React
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

    const toggleSkinCondition = (condition) => {
        setSkinConditions((prev) =>
            prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
        );
    };

    const toggleCosmeticAllergen = (allergen) => {
        setCosmeticAllergens(prev => prev.includes(allergen) ? prev.filter(a => a !== allergen) : [...prev, allergen]);
    };

    // V5: Toggle health goal
    const toggleHealthGoal = (goal) => {
        hapticLight();
        setHealthGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
    };

    const handleManageFamily = () => {
        router.push('/add-family-member');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.blurTop} />
            <View style={styles.blurBottom} />

            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <View style={styles.headerLeft}>
                    <Pressable style={styles.headerButton} onPress={() => router.back()}>
                        <ArrowLeft size={24} color={colors.primary} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                </View>
                <Pressable style={styles.infoButton} onPress={() => setShowInfoModal(true)}>
                    <Info size={24} color={colors.primary} />
                </Pressable>
            </View>

            <ScrollView style={styles.main} contentContainerStyle={styles.mainContent}>
                <Pressable
                    style={styles.manageButton}
                    onPress={handleManageFamily}
                >
                    <View style={styles.manageButtonLeft}>
                        <UserPlus size={20} color={colors.primary} />
                        <Text style={styles.manageButtonText}>Manage family</Text>
                    </View>
                    <ArrowLeft size={16} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
                </Pressable>

                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {name.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                        <Pressable style={styles.cameraButton} onPress={pickImage} disabled={uploadingImage}>
                            {uploadingImage ? (
                                <ActivityIndicator size="small" color={colors.primaryForeground} />
                            ) : (
                                <Camera size={16} color={colors.primaryForeground} />
                            )}
                        </Pressable>
                    </View>
                    <View style={styles.avatarInfo}>
                        <Text style={styles.avatarName}>{name || 'Your Name'}</Text>
                        <Text style={styles.avatarBadge}>{getAgeGroupLabel(age).toUpperCase()} PROFILE</Text>
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
                            placeholder="Enter your name"
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Age</Text>
                        <View style={styles.ageInputRow}>
                            <TextInput
                                style={styles.ageInput}
                                value={age}
                                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                                placeholder="Enter age"
                                placeholderTextColor={colors.mutedForeground}
                                keyboardType="number-pad"
                                maxLength={3}
                            />
                            <View style={styles.ageGroupBadge}>
                                <Text style={styles.ageGroupBadgeText}>{getAgeGroup(age).charAt(0).toUpperCase() + getAgeGroup(age).slice(1)}</Text>
                            </View>
                        </View>
                        <Text style={styles.ageHint}>
                            Age helps us provide appropriate safety recommendations
                        </Text>
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

                    {/* Phase 4: Allergy Severity Settings */}
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

                {/* V5: Health Goals Section */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.prefTitle}>Health Goals</Text>
                            <Text style={styles.prefSubtitle}>We'll tailor our analysis to your goals</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {[
                            { key: 'lose_weight', label: '🎯 Lose Weight' },
                            { key: 'gain_muscle', label: '💪 Build Muscle' },
                            { key: 'eat_healthier', label: '🥗 Eat Healthier' },
                            { key: 'manage_diabetes', label: '🩸 Manage Diabetes' },
                            { key: 'reduce_sugar', label: '🚫 Reduce Sugar' },
                            { key: 'heart_health', label: '❤️ Heart Health' },
                            { key: 'improve_energy', label: '⚡ Improve Energy' },
                            { key: 'better_sleep', label: '😴 Better Sleep' },
                            { key: 'reduce_inflammation', label: '🪩 Reduce Inflammation' },
                            { key: 'food_sensitivity', label: '🤔 Food Sensitivity' },
                        ].map((goal) => (
                            <Pressable
                                key={goal.key}
                                style={[styles.tag, healthGoals.includes(goal.key) && styles.tagActive]}
                                onPress={() => toggleHealthGoal(goal.key)}
                            >
                                <Text style={[styles.tagText, healthGoals.includes(goal.key) && styles.tagTextActive]}>
                                    {goal.label}
                                </Text>
                                {healthGoals.includes(goal.key) && <X size={14} color={colors.chart1} />}
                            </Pressable>
                        ))}
                    </View>
                </View>




                {/* Health Concerns */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.prefTitle}>Health Concerns</Text>
                            <Text style={styles.prefSubtitle}>We'll flag related ingredients</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {['Allergies', 'Digestive issues', 'Skin sensitivity', 'Weight management', 'Heart health', 'Diabetes', 'Anxiety', 'Afternoon fatigue'].map((c) => (
                            <Pressable
                                key={c}
                                style={[styles.tag, healthConcerns.includes(c) && styles.tagActive]}
                                onPress={() => {
                                    hapticLight();
                                    setHealthConcerns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
                                }}
                            >
                                <Text style={[styles.tagText, healthConcerns.includes(c) && styles.tagTextActive]}>{c}</Text>
                                {healthConcerns.includes(c) && <X size={14} color={colors.chart1} />}
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Info Preferences */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.prefTitle}>Information Preferences</Text>
                            <Text style={styles.prefSubtitle}>What matters most in your scans</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {['Allergen warnings', 'Safer alternatives', 'Additive details', 'Nutritional breakdown', 'Ingredient safety'].map((p) => (
                            <Pressable
                                key={p}
                                style={[styles.tag, infoPreferences.includes(p) && styles.tagActive]}
                                onPress={() => {
                                    hapticLight();
                                    setInfoPreferences(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
                                }}
                            >
                                <Text style={[styles.tagText, infoPreferences.includes(p) && styles.tagTextActive]}>{p}</Text>
                                {infoPreferences.includes(p) && <X size={14} color={colors.chart1} />}
                            </Pressable>
                        ))}
                    </View>
                </View>

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
                                    onPress={() => showAlert(
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
                        {['normal', 'dry', 'oily', 'combination', 'sensitive'].map((type) => (
                            <Pressable
                                key={type}
                                style={[styles.tag, skinType?.toLowerCase() === type.toLowerCase() && styles.tagActiveSkin]}
                                onPress={() => setSkinType(type)}
                            >
                                <Text style={[styles.tagText, skinType?.toLowerCase() === type.toLowerCase() && styles.tagTextActiveSkin]}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Region Selector - Phase 3 */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View>
                            <Text style={styles.prefTitle}>Region</Text>
                            <Text style={styles.prefSubtitle}>For location-specific ingredient regulations</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {[
                            { code: 'US', label: 'USA' },
                            { code: 'EU', label: 'Europe' },
                            { code: 'IN', label: 'India' },
                            { code: 'UK', label: 'UK' },
                            { code: 'AU', label: 'Australia' },
                            { code: 'OTHER', label: 'Other' },
                        ].map((r) => (
                            <Pressable
                                key={r.code}
                                style={[styles.tag, region === r.code && styles.tagActiveRegion]}
                                onPress={() => setRegion(r.code)}
                            >
                                <Text style={[styles.tagText, region === r.code && styles.tagTextActiveRegion]}>
                                    {r.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Sensitivity Level - Phase 3 */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View>
                            <Text style={styles.prefTitle}>Analysis Sensitivity</Text>
                            <Text style={styles.prefSubtitle}>Adjust how strict our recommendations are</Text>
                        </View>
                    </View>
                    <View style={styles.sensitivityContainer}>
                        {[
                            { level: 'standard', label: 'Standard', icon: 'check', desc: 'Balanced recommendations' },
                            { level: 'cautious', label: 'Cautious', icon: 'alert', desc: 'More warnings shown' },
                            { level: 'sensitive', label: 'Sensitive', icon: 'shield', desc: 'Strictest analysis' },
                        ].map((s) => (
                            <Pressable
                                key={s.level}
                                style={[styles.sensitivityOption, sensitivityLevel === s.level && styles.sensitivityOptionActive]}
                                onPress={() => setSensitivityLevel(s.level)}
                            >
                                {s.icon === 'check' && <CheckCircle size={24} color={sensitivityLevel === s.level ? colors.primary : colors.mutedForeground} />}
                                {s.icon === 'alert' && <AlertTriangle size={24} color={sensitivityLevel === s.level ? colors.chart2 : colors.mutedForeground} />}
                                {s.icon === 'shield' && <ShieldCheck size={24} color={sensitivityLevel === s.level ? colors.chart3 : colors.mutedForeground} />}
                                <View style={styles.sensitivityInfo}>
                                    <Text style={[styles.sensitivityLabel, sensitivityLevel === s.level && styles.sensitivityLabelActive]}>
                                        {s.label}
                                    </Text>
                                    <Text style={styles.sensitivityDesc}>{s.desc}</Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Skin Concerns (optional) */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View>
                            <Text style={styles.prefTitle}>Skin Concerns (optional)</Text>
                            <Text style={styles.prefSubtitle}>Used to highlight ingredients that may help or worsen these concerns</Text>
                        </View>
                    </View>
                    <View style={styles.tagContainer}>
                        {['acne_prone', 'eczema', 'rosacea', 'aging', 'dull'].map((condition) => (
                            <Pressable
                                key={condition}
                                style={[styles.tag, skinConditions.includes(condition) && styles.tagActiveSkin]}
                                onPress={() => toggleSkinCondition(condition)}
                            >
                                <Text style={[styles.tagText, skinConditions.includes(condition) && styles.tagTextActiveSkin]}>
                                    {condition.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                </Text>
                                {skinConditions.includes(condition) && <X size={14} color={colors.primary} />}
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

                {/* Custom Preferences */}
                <View style={styles.prefCard}>
                    <View style={styles.prefHeader}>
                        <View>
                            <Text style={styles.prefTitle}>Custom Preferences</Text>
                            <Text style={styles.prefSubtitle}>Add other ingredients to avoid</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="E.g. Strawberry, Palm Oil..."
                                placeholderTextColor={colors.mutedForeground}
                                value={customAllergen}
                                onChangeText={setCustomAllergen}
                                onSubmitEditing={addCustomAllergen}
                                returnKeyType="done"
                            />
                            <Pressable
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: radius['2xl'],
                                    backgroundColor: colors.primary,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onPress={addCustomAllergen}
                            >
                                <Plus size={24} color={colors.primaryForeground} />
                            </Pressable>
                        </View>
                    </View>

                    {allergens.filter(a => !['peanuts', 'tree_nuts', 'milk', 'eggs', 'soy', 'wheat', 'fish', 'shellfish'].includes(a)).length > 0 && (
                        <View style={[styles.tagContainer, { marginTop: spacing[2] }]}>
                            {allergens
                                .filter(a => !['peanuts', 'tree_nuts', 'milk', 'eggs', 'soy', 'wheat', 'fish', 'shellfish'].includes(a))
                                .map((allergen) => (
                                    <Pressable
                                        key={allergen}
                                        style={[styles.tag, styles.tagActiveSpecial]}
                                        onPress={() => toggleAllergy(allergen)}
                                    >
                                        <Text style={[styles.tagText, styles.tagTextActiveSpecial]}>
                                            {allergen.charAt(0).toUpperCase() + allergen.slice(1)}
                                        </Text>
                                        <X size={14} color={colors.destructive} />
                                    </Pressable>
                                ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
                <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
                    <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
                </Pressable>
            </View>

            {/* Info Modal */}
            <Modal
                visible={showInfoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowInfoModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowInfoModal(false)}
                >
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Personalized for You</Text>
                            <Pressable
                                style={styles.modalCloseButton}
                                onPress={() => setShowInfoModal(false)}
                            >
                                <X size={20} color={colors.mutedForeground} />
                            </Pressable>
                        </View>

                        <Text style={styles.modalSubtitle}>
                            Your profile helps us provide tailored safety recommendations for both food and cosmetics
                        </Text>

                        <View style={styles.infoCards}>
                            <View style={styles.infoCard}>
                                <View style={styles.infoCardIcon}>
                                    <Users size={20} color={colors.primary} />
                                </View>
                                <View style={styles.infoCardContent}>
                                    <Text style={styles.infoCardTitle}>Age Matters</Text>
                                    <Text style={styles.infoCardDesc}>
                                        Different ages have different safety thresholds. We check for ingredients restricted for infants, children, or adults in both diet and skincare.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={styles.infoCardIcon}>
                                    <Shield size={20} color={colors.primary} />
                                </View>
                                <View style={styles.infoCardContent}>
                                    <Text style={styles.infoCardTitle}>Allergy Alerts</Text>
                                    <Text style={styles.infoCardDesc}>
                                        We detect allergens in food (e.g., Peanuts) and cosmetics (e.g., Fragrances) and warn you before using potentially harmful items.
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoCard}>
                                <View style={styles.infoCardIcon}>
                                    <Sparkles size={20} color={colors.primary} />
                                </View>
                                <View style={styles.infoCardContent}>
                                    <Text style={styles.infoCardTitle}>Lifestyle & Skin</Text>
                                    <Text style={styles.infoCardDesc}>
                                        From dietary preferences to skin conditions, we tailor safety scores to match your specific health needs.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <Pressable
                            style={styles.modalButton}
                            onPress={() => setShowInfoModal(false)}
                        >
                            <Text style={styles.modalButtonText}>Got it!</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
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
        fontFamily: fonts.heading,
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
        fontFamily: fonts.heading,
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
        fontFamily: fonts.heading,
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
    ageInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[3],
    },
    ageInput: {
        flex: 1,
        height: 56,
        backgroundColor: colors.input,
        borderRadius: radius['2xl'],
        paddingHorizontal: spacing[5],
        fontSize: 16,
        fontFamily: fonts.sansSemiBold,
        color: colors.foreground,
    },
    ageGroupBadge: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
    },
    ageGroupBadgeText: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    ageHint: {
        fontSize: 11,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginTop: spacing[2],
        paddingHorizontal: spacing[1],
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
        backgroundColor: colors.chart3,
        borderColor: colors.chart3,
    },
    tagText: {
        fontSize: 12,
        fontFamily: fonts.sansBold,
        color: colors.primary,
    },
    tagTextActive: {
        color: '#FFFFFF',
    },
    tagActiveSkin: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tagTextActiveSkin: {
        color: colors.primaryForeground,
    },
    tagActiveAllergen: {
        backgroundColor: colors.destructive,
        borderColor: colors.destructive,
    },
    tagTextActiveAllergen: {
        color: '#FFFFFF',
    },
    tagActiveSpecial: {
        backgroundColor: colors.destructive,
        borderColor: colors.destructive,
    },
    tagTextActiveSpecial: {
        color: '#FFFFFF',
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
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing[6],
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: radius['3xl'],
        padding: spacing[6],
        width: '100%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing[2],
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: fonts.heading,
        color: colors.foreground,
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        marginBottom: spacing[5],
    },
    infoCards: {
        gap: spacing[4],
        marginBottom: spacing[5],
    },
    infoCard: {
        flexDirection: 'row',
        gap: spacing[3],
    },
    infoCardIcon: {
        width: 40,
        height: 40,
        borderRadius: radius.xl,
        backgroundColor: colors.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoCardContent: {
        flex: 1,
    },
    infoCardTitle: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: 2,
    },
    infoCardDesc: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
        lineHeight: 18,
    },
    modalButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing[4],
        borderRadius: radius.full,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontFamily: fonts.sansBold,
        color: colors.primaryForeground,
    },
    // Phase 3: Region Selector styles
    tagActiveRegion: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tagTextActiveRegion: {
        color: colors.primaryForeground,
    },
    // Phase 3: Sensitivity Level styles
    sensitivityContainer: {
        gap: spacing[2],
    },
    sensitivityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing[3],
        backgroundColor: colors.muted,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing[3],
    },
    sensitivityOptionActive: {
        backgroundColor: `${colors.primary}15`,
        borderColor: colors.primary,
    },
    sensitivityEmoji: {
        fontSize: 24,
    },
    sensitivityInfo: {
        flex: 1,
    },
    sensitivityLabel: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    sensitivityLabelActive: {
        color: colors.primary,
    },
    sensitivityDesc: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
    // Phase 4: Allergy Severity styles
    severitySection: {
        marginTop: spacing[4],
        paddingTop: spacing[4],
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    severitySectionTitle: {
        fontSize: 13,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing[3],
    },
    severityItem: {
        marginBottom: spacing[4],
        paddingBottom: spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    severityAllergenName: {
        fontSize: 14,
        fontFamily: fonts.sansBold,
        color: colors.foreground,
        marginBottom: spacing[2],
    },
    severityRow: {
        flexDirection: 'row',
        gap: spacing[2],
        marginBottom: spacing[2],
    },
    severityOption: {
        flex: 1,
        paddingVertical: spacing[2],
        paddingHorizontal: spacing[3],
        borderRadius: radius.lg,
        backgroundColor: colors.muted,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    severityOptionActive: {
        backgroundColor: `${colors.chart2}20`,
        borderColor: colors.chart2,
    },
    severityOptionSevere: {
        backgroundColor: `${colors.chart3}20`,
        borderColor: colors.chart3,
    },
    severityOptionText: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
    severityOptionTextActive: {
        fontFamily: fonts.sansBold,
        color: colors.foreground,
    },
    avoidAlwaysRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing[2],
    },
    avoidCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: colors.chart3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avoidCheckboxActive: {
        backgroundColor: colors.chart3,
    },
    avoidCheckmark: {
        color: colors.primaryForeground,
        fontSize: 12,
        fontFamily: fonts.sansBold,
    },
    avoidAlwaysText: {
        fontSize: 12,
        fontFamily: fonts.sans,
        color: colors.mutedForeground,
    },
});
