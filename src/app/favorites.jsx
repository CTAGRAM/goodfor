import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    ArrowLeft,
    Search,
    Heart,
    CheckCircle,
    AlertTriangle,
    Info
} from "lucide-react-native";
import { colors, fonts, spacing, radius } from "@/constants/theme";

export default function Favorites() {
    const insets = useSafeAreaInsets();
    const router = useRouter();

    const categories = [
        { id: 1, name: "All Items", active: true },
        { id: 2, name: "Groceries", active: false },
        { id: 3, name: "Wellness", active: false },
        { id: 4, name: "Personal Care", active: false },
    ];

    const favoritesData = [
        {
            id: 1,
            name: "Organic Salad Mix",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80",
            safety: "safe",
            safetyLabel: "Safe",
            safetyIcon: CheckCircle,
            scannedTime: "Scanned 2d ago",
        },
        {
            id: 2,
            name: "Greek Style Yogurt",
            image: "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80",
            safety: "safe",
            safetyLabel: "Safe",
            safetyIcon: CheckCircle,
            scannedTime: "Scanned 1w ago",
        },
        {
            id: 3,
            name: "Kids Multivitamin",
            image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80",
            safety: "caution",
            safetyLabel: "Avoid",
            safetyIcon: AlertTriangle,
            scannedTime: "Scanned 3d ago",
        },
        {
            id: 4,
            name: "Organic Berry Jam",
            image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&q=80",
            safety: "avoid",
            safetyLabel: "Caution",
            safetyIcon: Info,
            scannedTime: "Scanned 2w ago",
        },
    ];

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

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />

            {/* Decorative Background Blurs */}
            <View style={styles.blurTopRight} />
            <View style={styles.blurLeft} />

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <ArrowLeft size={20} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Favorites</Text>
                </View>
                <View style={styles.profileContainer}>
                    <Image
                        source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                        style={styles.profileImage}
                    />
                </View>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingBottom: insets.bottom + 40 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <Search size={20} color={colors.mutedForeground} style={styles.searchIcon} />
                        <TextInput
                            placeholder="Search favorites..."
                            placeholderTextColor={colors.mutedForeground}
                            style={styles.searchInput}
                        />
                    </View>
                </View>

                {/* Category Filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                >
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryButton,
                                category.active && styles.categoryButtonActive
                            ]}
                        >
                            <Text style={[
                                styles.categoryText,
                                category.active && styles.categoryTextActive
                            ]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Products Grid */}
                <View style={styles.productsGrid}>
                    {favoritesData.map((item) => {
                        const SafetyIcon = item.safetyIcon;
                        const safetyColor = getSafetyColor(item.safety);

                        return (
                            <View key={item.id} style={styles.productCard}>
                                {/* Image Container */}
                                <View style={styles.imageContainer}>
                                    <View style={styles.imageWrapper}>
                                        <Image source={{ uri: item.image }} style={styles.productImage} />
                                        {/* Heart Button */}
                                        <TouchableOpacity style={styles.heartButton}>
                                            <Heart size={16} color={colors.destructive} fill={colors.destructive} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Product Info */}
                                <View style={styles.productInfo}>
                                    <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                                    <View style={styles.productMeta}>
                                        <View style={styles.safetyRow}>
                                            <Text style={[styles.safetyText, { color: safetyColor }]}>
                                                {item.safetyLabel}
                                            </Text>
                                            <SafetyIcon size={14} color={safetyColor} strokeWidth={2.5} />
                                        </View>
                                        <Text style={styles.scannedText}>{item.scannedTime}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
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

    // Background Blurs
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

    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingBottom: 16,
        zIndex: 10,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.card,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: `${colors.border}80`,
    },
    headerTitle: {
        fontSize: 20,
        fontFamily: fonts.heading.extrabold,
        color: colors.foreground,
    },
    profileContainer: {
        position: "relative",
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#FFFFFF",
    },

    // Scroll View
    scrollView: {
        flex: 1,
        zIndex: 10,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },

    // Search
    searchContainer: {
        marginTop: 16,
        marginBottom: 24,
    },
    searchInputWrapper: {
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
    },
    searchIcon: {
        position: "absolute",
        left: 16,
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        height: 48,
        paddingLeft: 48,
        paddingRight: 16,
        backgroundColor: colors.input,
        borderRadius: 16,
        fontSize: 14,
        fontFamily: fonts.sans.medium,
        color: colors.foreground,
    },

    // Categories
    categoriesContainer: {
        gap: 8,
        paddingBottom: 16,
        marginBottom: 8,
    },
    categoryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: `${colors.border}80`,
    },
    categoryButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryText: {
        fontSize: 12,
        fontFamily: fonts.sans.semibold,
        color: colors.mutedForeground,
    },
    categoryTextActive: {
        color: colors.primaryForeground,
        fontFamily: fonts.sans.bold,
    },

    // Products Grid
    productsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
        paddingTop: 0,
        paddingBottom: 20,
    },
    productCard: {
        width: "47%",
        flexDirection: "column",
    },
    imageContainer: {
        aspectRatio: 1,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        padding: 8,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: `${colors.border}33`,
    },
    imageWrapper: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden",
        position: "relative",
    },
    productImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    heartButton: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    productInfo: {
        paddingHorizontal: 4,
    },
    productName: {
        fontSize: 14,
        fontFamily: fonts.sans.bold,
        color: colors.foreground,
    },
    productMeta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 2,
    },
    safetyRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    safetyText: {
        fontSize: 12,
        fontFamily: fonts.sans.bold,
    },
    scannedText: {
        fontSize: 10,
        fontFamily: fonts.sans.medium,
        color: colors.mutedForeground,
    },
});
