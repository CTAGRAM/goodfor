import { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,

    FlatList,
    Image
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ArrowLeft,
    Sparkles,
    ArrowUp,
    User,
    UserCircle,
    Baby,
    Bot,
    UserCheck,
    MessageSquare,
    Clock,
    Plus,
    Trash2,
    ChevronRight,
    Edit2,
    Package,
    Camera
} from "lucide-react-native";
import { colors, fonts, radius } from "@/constants/theme";
import { sendMessage } from "@/lib/openai";
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseAuth";
import MarkdownText from "@/components/MarkdownText";
import GenUIRenderer from "@/components/GenUIRenderer";
import { useAlert } from "@/contexts/AlertContext";
import { TypingDots } from '@/components/AnimatedEffects';

const HISTORY_STORAGE_KEY = 'goodfor_chat_history';

export default function AIChat() {
    const { showAlert } = useAlert();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user, profile, activeFamilyMember, updateProfile } = useAuth();

    // Dynamic storage key based on active profile
    const getStorageKey = () => `goodfor_chat_history_${activeFamilyMember ? activeFamilyMember.id : 'main'}`;

    // View Modes: 'history' (list of chats) | 'chat' (active conversation)
    const [viewMode, setViewMode] = useState('history');
    const [initialMessageSent, setInitialMessageSent] = useState(false);

    // Chat State
    const [chatHistory, setChatHistory] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [selectedAge, setSelectedAge] = useState("adult");
    const [isLoading, setIsLoading] = useState(false);
    const [productInfo, setProductInfo] = useState(null); // Product context from scan
    const [autoSendDone, setAutoSendDone] = useState(false);
    const [pendingImage, setPendingImage] = useState(null); // { uri, base64, mimeType }

    // Context State
    const [userContext, setUserContext] = useState({});
    const scrollViewRef = useRef(null);

    const [quickPrompts, setQuickPrompts] = useState([
        "Is this product safe for kids?",
        "Does this product have any health risks?",
        "What are healthier alternatives to this product?",
        "Does this product contain allergens?",
    ]);

    // Update prompts based on product context
    useEffect(() => {
        if (productInfo) {
            setQuickPrompts([
                "Is this product safe for kids?",
                "Does this product have any health risks?",
                "What are healthier alternatives to this product?",
                "Does this product contain allergens?",
            ]);
        } else {
            setQuickPrompts([
                "Is this product safe for kids?",
                "What are healthier alternatives to this product?",
                "Suggest a healthy recipe with my scanned products",
                "Help me plan a healthy meal for this week",
            ]);
        }
    }, [productInfo]);

    const ageOptions = [
        { id: "adult", label: "Adult", icon: User },
        { id: "child", label: "Child", icon: UserCircle },
        { id: "toddler", label: "Toddler", icon: Baby },
    ];

    // Load History on Mount
    useEffect(() => {
        loadChatHistory();
    }, []);

    // Load Context on Focus (Real-time updates)
    useFocusEffect(
        useCallback(() => {
            fetchUserContext();
            loadChatHistory();
        }, [user?.id, activeFamilyMember])
    );

    // Handle product context from scan result — auto-start chat
    useEffect(() => {
        if (params.productContext && !autoSendDone) {
            try {
                const ctx = JSON.parse(params.productContext);
                setProductInfo(ctx);
                // Start a new chat immediately
                const newId = Date.now().toString();
                setCurrentChatId(newId);
                setMessages([]);
                setViewMode('chat');
            } catch (e) {
                console.error('[AIChat] Failed to parse productContext:', e);
            }
        }
    }, [params.productContext]);

    // Handle initialMessage from AI tab text input
    useEffect(() => {
        // If explicitly asked to show history, force it
        if (params.showHistory === 'true') {
            setViewMode('history');
            return;
        }
        if (params.initialMessage && !initialMessageSent) {
            setInitialMessageSent(true);
            const newId = Date.now().toString();
            setCurrentChatId(newId);
            setMessages([]);
            setViewMode('chat');
            // Delay slightly so state is settled before sending
            setTimeout(() => {
                handleSend(params.initialMessage);
            }, 300);
        }
    }, [params.initialMessage, params.showHistory]);

    // Auto-send the initial product analysis prompt once context is loaded
    useEffect(() => {
        if (productInfo && viewMode === 'chat' && !autoSendDone && messages.length === 0 && !isLoading) {
            setAutoSendDone(true);
            autoSendProductAnalysis(productInfo);
        }
    }, [productInfo, viewMode, autoSendDone, messages.length, isLoading]);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (viewMode === 'chat') {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, viewMode]);

    const loadChatHistory = async () => {
        try {
            const key = getStorageKey();
            const jsonValue = await AsyncStorage.getItem(key);
            if (jsonValue != null) {
                setChatHistory(JSON.parse(jsonValue));
            } else {
                setChatHistory([]);
            }
        } catch (e) {
            console.error("Failed to load chat history", e);
        }
    };

    const fetchUserContext = async () => {
        if (!user?.id) return;

        try {
            // Fetch recent scans with PRODUCT DETAILS
            let query = supabase
                .from('scans')
                .select('*, products(name, brand, category, ingredients, nutrition_facts)')
                .eq('user_id', user.id);

            if (activeFamilyMember) {
                query = query.eq('family_member_id', activeFamilyMember.id);
            } else {
                query = query.is('family_member_id', null);
            }

            const { data: recentScans, error: scansError } = await query
                .order('scanned_at', { ascending: false })
                .limit(10);

            if (scansError) {
                console.error('[AIChat] Scans fetch error:', scansError);
            }

            console.log('[AIChat] Raw scans from DB:', recentScans?.length || 0, recentScans?.slice(0, 2));

            // Fetch favorites
            const { data: favorites } = await supabase
                .from('favorites')
                .select('product_name')
                .eq('user_id', user.id)
                .limit(5);

            // Fetch Family Members
            const { data: familyMembers } = await supabase
                .from('family_members')
                .select('*')
                .eq('user_id', user.id);

            const formattedScans = (recentScans || []).map(s => {
                // Fallback logic if products join returns null
                const productName = s.products?.name || s.product_name || 'Unknown Product';
                const brand = s.products?.brand || s.product_brand || '';

                console.log('[AIChat] Scan item:', {
                    hasProductJoin: !!s.products,
                    productName,
                    brand,
                    category: s.products?.category || s.category,
                    hasIngredients: !!s.products?.ingredients
                });

                return {
                    product_name: productName,
                    brand: brand,
                    safety_level: s.safety_level,
                    safety_score: s.safety_score,
                    category: s.products?.category || s.category,
                    ingredients: s.products?.ingredients?.text || null
                };
            });

            setUserContext({
                allergens: activeFamilyMember?.allergens || profile?.allergens || [],
                dietaryPreferences: activeFamilyMember?.dietary_preferences || profile?.dietary_preferences || [],
                recentScans: formattedScans,
                favorites: (favorites || []).map(f => ({ product_name: f.product_name })),
                familyMembers: familyMembers || [],
                userName: activeFamilyMember?.name || profile?.full_name || 'User'
            });

            console.log('[AIChat] User context fetched:', {
                scansCount: formattedScans.length,
                familyCount: familyMembers?.length || 0,
                allergens: profile?.allergens,
                scans: formattedScans.slice(0, 2) // First 2 scans for verification
            });

        } catch (error) {
            console.error('[AIChat] Error fetching user context:', error);
        }
    };

    const saveHistoryToStorage = async (updatedHistory) => {
        try {
            const key = getStorageKey();
            const jsonValue = JSON.stringify(updatedHistory);
            await AsyncStorage.setItem(key, jsonValue);
            setChatHistory(updatedHistory);
        } catch (e) {
            console.error("Failed to save chat history", e);
        }
    };

    const startNewChat = () => {
        const newId = Date.now().toString();
        setCurrentChatId(newId);
        setMessages([]);
        setMessage("");
        setProductInfo(null); // Clear product context for fresh chat
        setAutoSendDone(false);
        setViewMode('chat');
    };

    // Auto-send product analysis when coming from a scan
    const autoSendProductAnalysis = async (ctx) => {
        let autoPrompt;

        // Safely serialize arrays that might contain objects
        const serializeArray = (arr) => {
            if (!Array.isArray(arr) || arr.length === 0) return '';
            return arr.map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object' && item !== null) {
                    return item.name || item.title || item.description || JSON.stringify(item);
                }
                return String(item);
            }).join(', ');
        };

        // Food-specific prompt
        const issuesStr = serializeArray(ctx.issues);
        const allergensStr = serializeArray(ctx.allergens);
        const additivesStr = serializeArray(ctx.additives);
        const issuesList = issuesStr ? `\nConcerns: ${issuesStr}` : '';
        const allergensList = allergensStr ? `\nAllergens: ${allergensStr}` : '';
        const additivesList = additivesStr ? `\nAdditives: ${additivesStr}` : '';

        autoPrompt = `Analyze this product I just scanned:\n\n` +
            `**${ctx.name}**${ctx.brand ? ` by ${ctx.brand}` : ''}\n` +
            `Safety Score: ${ctx.safetyScore}/100 (${ctx.safetyLevel})` +
            (ctx.nutriGrade ? ` | Nutri-Score: ${ctx.nutriGrade.toUpperCase()}` : '') +
            (ctx.novaGroup ? ` | NOVA: ${ctx.novaGroup}` : '') +
            issuesList + allergensList + additivesList +
            (ctx.ingredientsText ? `\n\nIngredients: ${ctx.ingredientsText.substring(0, 500)}` : '') +
            `\n\nGive me a clear breakdown of whether this product is good for me based on my profile. Highlight any concerns and suggest what to watch out for.`;

        const userMessage = { role: "user", content: autoPrompt };
        const newMessages = [userMessage];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await sendMessage(newMessages, selectedAge, userContext);
            const assistantMessage = { role: "assistant", content: response };
            const finalMessages = [...newMessages, assistantMessage];

            setMessages(finalMessages);

            // Save to history
            const timestamp = Date.now();
            const title = `${ctx.name}${ctx.brand ? ` — ${ctx.brand}` : ''}`;

            const activeChatId = currentChatId || timestamp.toString();
            if (!currentChatId) setCurrentChatId(activeChatId);

            const updatedHistory = [...chatHistory];
            const chatEntry = {
                id: activeChatId,
                title: title.length > 35 ? title.substring(0, 35) + '...' : title,
                timestamp,
                messages: finalMessages,
                preview: response.substring(0, 50) + "...",
                productContext: ctx, // Store for future reference
            };

            updatedHistory.unshift(chatEntry);
            await saveHistoryToStorage(updatedHistory);
        } catch (error) {
            setMessages([
                ...newMessages,
                { role: "assistant", content: "Sorry, I encountered an error analyzing this product. Please try again." }
            ]);
            console.error("AI auto-send error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const openChat = (chat) => {
        setCurrentChatId(chat.id);
        setMessages(chat.messages || []);
        setViewMode('chat');
    };

    const deleteChat = (id) => {
        showAlert(
            "Delete Chat",
            "Are you sure you want to delete this conversation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const updated = chatHistory.filter(c => c.id !== id);
                        await saveHistoryToStorage(updated);
                        if (currentChatId === id) {
                            setViewMode('history');
                            setCurrentChatId(null);
                        }
                    }
                }
            ]
        );
    };

    const checkRateLimit = async () => {
        if (!profile) return false;

        const isPro = profile.subscription_tier === 'pro';
        const limit = isPro ? 60 : 10;
        const today = new Date().toISOString().split('T')[0];

        let count = profile.daily_chat_count || 0;
        const lastDate = profile.last_chat_date;

        if (lastDate !== today) {
            count = 0; // Reset if new day
        }

        if (count >= limit) {
            showAlert(
                "Limit Reached",
                `You've used your ${limit} free chats for today. Upgrade to Pro for more!`,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Upgrade", onPress: () => router.push('/subscription') }
                ]
            );
            return false;
        }

        // Increment locally and in DB
        const newCount = count + 1;

        // Optimistic update handled by updateProfile? 
        // We generally want to wait for success, but let's proceed.
        // We'll update the profile in valid send flow.
        return { valid: true, newCount, today };
    };

    const getLimitLabel = () => {
        const isPro = profile?.subscription_tier === 'pro';
        const limit = isPro ? 60 : 10;
        const count = (profile?.last_chat_date === new Date().toISOString().split('T')[0])
            ? (profile?.daily_chat_count || 0)
            : 0;
        return `${limit - count} chats remaining`;
    };

    const handleSend = async (manualText = null) => {
        const textToSend = manualText || message;
        if ((!textToSend.trim() && !pendingImage) || isLoading) return;

        // Check Limit
        const limitCheck = await checkRateLimit();
        if (!limitCheck) return; // Limit reached

        const userMsgContent = textToSend.trim();
        const currentImage = pendingImage;
        const userMessage = { role: "user", content: userMsgContent };
        // Attach image URI for rendering in chat bubble (not base64, just the local URI)
        if (currentImage) {
            userMessage.imageUri = currentImage.uri;
        }
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setMessage("");
        setPendingImage(null);
        setIsLoading(true);

        // Update Usage
        // Update local profile state if possible, though AuthContext might not expose a setter for specific fields easily without a full reload.
        // We will rely on the DB update and eventually the profile will refresh.
        // But for UI responsiveness, we might want to manually decrement the "Remaining" count in a local state if we had one, 
        // OR just trust the "Optimistic" nature of the user interaction. 
        // For now, we just update DB.

        try {
            // Unified path: sendMessage handles both text and image via edge function
            const imageData = currentImage ? { base64: currentImage.base64, mimeType: currentImage.mimeType || 'image/jpeg' } : null;
            const response = await sendMessage(newMessages, selectedAge, userContext, false, imageData);
            const assistantMessage = { role: "assistant", content: response };
            const finalMessages = [...newMessages, assistantMessage];

            setMessages(finalMessages);

            // Increment Count in DB
            // We use the limitCheck result values
            const { newCount, today } = limitCheck;

            // 1. Update DB (Remote)
            await supabase.from('profiles').update({
                daily_chat_count: newCount,
                last_chat_date: today
            }).eq('id', user.id);

            // 2. Update Local Profile (Real-time UI update)
            if (updateProfile) {
                // This updates the context state without a network refetch, 
                // allowing the "Remaining" count to decrement instantly.
                updateProfile({
                    daily_chat_count: newCount,
                    last_chat_date: today
                });
            }

            // Save to History
            const timestamp = Date.now();
            let title = "New Conversation";

            // Generate title from first message
            if (newMessages.length === 1) {
                title = userMsgContent.length > 30 ? userMsgContent.substring(0, 30) + "..." : userMsgContent;
            } else {
                // Keep existing title if editing existing chat
                const existing = chatHistory.find(c => c.id === currentChatId);
                if (existing) title = existing.title;
            }

            const activeChatId = currentChatId || timestamp.toString();
            if (!currentChatId) setCurrentChatId(activeChatId);

            const updatedHistory = [...chatHistory];
            const existingIndex = updatedHistory.findIndex(c => c.id === activeChatId);

            const chatEntry = {
                id: activeChatId,
                title,
                timestamp,
                messages: finalMessages,
                preview: response.substring(0, 50) + "..."
            };

            if (existingIndex >= 0) {
                updatedHistory[existingIndex] = chatEntry;
                // Move to top
                updatedHistory.sort((a, b) => b.timestamp - a.timestamp);
            } else {
                updatedHistory.unshift(chatEntry);
            }

            await saveHistoryToStorage(updatedHistory);

        } catch (error) {
            setMessages([
                ...newMessages,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." }
            ]);
            console.error("AI Chat error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.historyCard}
            onPress={() => openChat(item)}
        >
            <View style={styles.historyIcon}>
                <MessageSquare size={20} color={colors.primary} />
            </View>
            <View style={styles.historyInfo}>
                <Text style={styles.historyTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.historyDate}>
                    {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteChat(item.id)}
            >
                <Trash2 size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderAvatar = () => {
        const avatarUrl = activeFamilyMember ? activeFamilyMember.avatar_url : profile?.avatar_url;

        if (avatarUrl) {
            return (
                <Image
                    source={{ uri: avatarUrl }}
                    style={styles.headerAvatar}
                />
            );
        }
        return (
            <View style={styles.headerAvatarFallback}>
                <User size={20} color={colors.primary} />
            </View>
        );
    };

    const renderChatView = () => (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => setViewMode('history')}
                >
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Lumi</Text>
                    <Text style={styles.headerSubtitle}>{activeFamilyMember?.name || profile?.full_name || 'Your Profile'}</Text>
                </View>

                {/* Real User Profile Image */}
                <View style={styles.profileContainer}>
                    {renderAvatar()}
                </View>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Product Context Card — shown when coming from a scan */}
                {productInfo && (
                    <View style={styles.productContextCard}>
                        <View style={styles.productContextHeader}>
                            {productInfo.imageUrl ? (
                                <Image source={{ uri: productInfo.imageUrl }} style={styles.productContextImage} />
                            ) : (
                                <View style={[styles.productContextImage, { backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }]}>
                                    <Package size={20} color={colors.primary} />
                                </View>
                            )}
                            <View style={styles.productContextInfo}>
                                <Text style={styles.productContextName} numberOfLines={1}>{productInfo.name}</Text>
                                {productInfo.brand ? <Text style={styles.productContextBrand}>{productInfo.brand}</Text> : null}
                            </View>
                            <View style={[styles.productContextBadge, {
                                backgroundColor: productInfo.safetyLevel === 'SAFE' ? `${colors.chart1}20` :
                                    productInfo.safetyLevel === 'CAUTION' ? `${colors.chart2}20` : `${colors.chart3}20`
                            }]}>
                                <Text style={[styles.productContextScore, {
                                    color: productInfo.safetyLevel === 'SAFE' ? colors.chart1 :
                                        productInfo.safetyLevel === 'CAUTION' ? colors.chart2 : colors.chart3
                                }]}>{productInfo.safetyScore}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {messages.length === 0 && !productInfo ? (
                    <View style={styles.emptyState}>
                        <Image
                            source={require("../../assets/images/lumi-mascot.png")}
                            style={{ width: 120, height: 120, marginBottom: 16 }}
                            resizeMode="contain"
                        />
                        <Text style={styles.emptyTitle}>Ask Lumi</Text>
                        <Text style={styles.emptyDesc}>
                            I have your recent scans, family profiles, and preferences loaded. Ask me anything!
                        </Text>
                    </View>
                ) : (
                    messages.map((msg, index) => (
                        <View
                            key={index}
                            style={[
                                styles.messageContainer,
                                msg.role === "user" ? styles.userMessageContainer : styles.assistantMessageContainer
                            ]}
                        >
                            {msg.role === "assistant" && (
                                <View style={styles.assistantAvatar}>
                                    <Bot size={16} color={colors.primaryForeground} />
                                </View>
                            )}
                            <View
                                style={[
                                    styles.messageBubble,
                                    msg.role === "user" ? styles.userBubble : styles.assistantBubble
                                ]}
                            >
                                {msg.role === "user" ? (
                                    <View>
                                        {msg.imageUri && (
                                            <Image
                                                source={{ uri: msg.imageUri }}
                                                style={{ width: 180, height: 180, borderRadius: 12, marginBottom: 8 }}
                                                resizeMode="cover"
                                            />
                                        )}
                                        {msg.content ? (
                                            <Text style={[styles.messageText, styles.userMessageText]}>
                                                {msg.content}
                                            </Text>
                                        ) : null}
                                    </View>
                                ) : (
                                    <GenUIRenderer
                                        content={msg.content}
                                        style={styles.markdownContainer}
                                        productContext={productInfo}
                                        isFirstAssistant={index === messages.findIndex(m => m.role === 'assistant')}
                                        onAction={(action) => {
                                            if (action?.startsWith('search:')) {
                                                const query = action.replace('search:', '');
                                                setMessage(`Tell me more about ${query}`);
                                            } else if (action === 'find_alternatives') {
                                                setMessage('What are healthier alternatives?');
                                            } else if (action === 'more_details') {
                                                setMessage('Give me more details about the ingredients');
                                            } else if (action === 'save_product') {
                                                showAlert('Saved', 'Product bookmarked!');
                                            }
                                        }}
                                    />
                                )}
                            </View>
                        </View>
                    ))
                )}
                {isLoading && (
                    <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
                        <View style={styles.assistantAvatar}>
                            <Image
                                source={require('../../assets/images/lumi-mascot.png')}
                                style={{ width: 28, height: 28, borderRadius: 14 }}
                                resizeMode="contain"
                            />
                        </View>
                        <View style={[styles.messageBubble, styles.assistantBubble, { paddingVertical: 10, paddingHorizontal: 14 }]}>
                            <TypingDots dotSize={8} />
                        </View>
                    </View>
                )}
            </ScrollView>

            <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 10 }]}>
                {/* Quick Prompts */}
                {messages.length === 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.chipsScroll}
                        contentContainerStyle={styles.chipsContent}
                    >
                        {quickPrompts.map((prompt, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.chipButton}
                                onPress={() => setMessage(prompt)}
                            >
                                <Text style={styles.chipText}>{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                <View style={[styles.inputBar, { flexDirection: 'column', alignItems: 'stretch', borderRadius: 24, padding: 12, gap: 12 }]}>
                    {/* Rate Limit Indicator */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 11, fontFamily: fonts.sans.medium, color: colors.mutedForeground }}>
                            {getLimitLabel()}
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/subscription')}>
                            <Text style={{ fontSize: 11, fontFamily: fonts.sans.bold, color: colors.primary }}>
                                {profile?.subscription_tier === 'pro' ? 'PRO' : 'UPGRADE'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                            style={styles.ageSelector}
                            onPress={() => {
                                const ages = ['adult', 'child', 'toddler'];
                                const currentIndex = ages.indexOf(selectedAge);
                                const nextIndex = (currentIndex + 1) % ages.length;
                                setSelectedAge(ages[nextIndex]);
                                const labels = { adult: 'Adult', child: 'Child', toddler: 'Toddler' };
                                showAlert('Age Profile', `Switched to ${labels[ages[nextIndex]]} mode`);
                            }}
                        >
                            {selectedAge === 'toddler' ? (
                                <Baby size={16} color={colors.primary} />
                            ) : selectedAge === 'child' ? (
                                <UserCircle size={16} color={colors.primary} />
                            ) : (
                                <User size={16} color={colors.primary} />
                            )}
                        </TouchableOpacity>

                        {/* V6: Image picker for photo analysis */}
                        <TouchableOpacity
                            style={styles.ageSelector}
                            onPress={async () => {
                                try {
                                    const result = await ImagePicker.launchImageLibraryAsync({
                                        mediaTypes: ['images'],
                                        quality: 0.8,
                                        base64: true,
                                    });
                                    if (!result.canceled && result.assets?.[0]?.base64) {
                                        const asset = result.assets[0];
                                        
                                        // Force convert to JPEG to strip HEIC and get valid base64
                                        const manipulatedImage = await ImageManipulator.manipulateAsync(
                                            asset.uri,
                                            [], // no resizing
                                            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                                        );

                                        setPendingImage({
                                            uri: manipulatedImage.uri,
                                            base64: manipulatedImage.base64,
                                            mimeType: 'image/jpeg',
                                        });
                                    }
                                } catch (e) {
                                    console.error('[AIChat] Image picker error:', e);
                                }
                            }}
                        >
                            <Camera size={16} color={pendingImage ? colors.chart1 : colors.primary} />
                        </TouchableOpacity>

                        {/* Pending image preview */}
                        {pendingImage && (
                            <View style={{ position: 'relative' }}>
                                <Image source={{ uri: pendingImage.uri }} style={{ width: 32, height: 32, borderRadius: 8 }} />
                                <TouchableOpacity
                                    style={{ position: 'absolute', top: -6, right: -6, backgroundColor: colors.destructive, borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}
                                    onPress={() => setPendingImage(null)}
                                >
                                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TextInput
                            style={styles.input}
                            placeholder="Type a question..."
                            placeholderTextColor={colors.mutedForeground}
                            value={message}
                            onChangeText={setMessage}
                            onSubmitEditing={() => handleSend()}
                        />

                        <TouchableOpacity
                            style={[styles.sendBtn, (!message.trim() && !pendingImage || isLoading) && styles.sendBtnDisabled]}
                            onPress={() => handleSend()}
                            disabled={(!message.trim() && !pendingImage) || isLoading}
                        >
                            <ArrowUp size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );

    const renderHistoryView = () => (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <ArrowLeft size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={styles.historyHeaderTitle}>Conversations</Text>
                <View style={styles.profileContainer}>
                    {renderAvatar()}
                </View>
            </View>

            <FlatList
                data={chatHistory}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: colors.card, padding: 16,
                            borderRadius: 20, marginBottom: 10,
                            borderWidth: 1, borderColor: `${colors.border}50`,
                        }}
                        onPress={() => openChat(item)}
                    >
                        <View style={{
                            width: 42, height: 42, borderRadius: 21,
                            backgroundColor: `${colors.primary}10`,
                            alignItems: 'center', justifyContent: 'center', marginRight: 14,
                        }}>
                            <MessageSquare size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 3 }} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: fonts.sans.regular, color: colors.mutedForeground }}>
                                {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={{ padding: 8 }}
                            onPress={() => deleteChat(item.id)}
                        >
                            <Trash2 size={16} color={`${colors.mutedForeground}80`} />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                ListHeaderComponent={
                    <View style={{ marginBottom: 16 }}>
                        {/* New Chat Button */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row', alignItems: 'center',
                                backgroundColor: colors.primary, padding: 16,
                                borderRadius: 20, marginBottom: 24,
                                shadowColor: colors.primary, shadowOpacity: 0.15,
                                shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
                                elevation: 4,
                            }}
                            onPress={startNewChat}
                        >
                            <View style={{
                                width: 44, height: 44, borderRadius: 22,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                alignItems: 'center', justifyContent: 'center', marginRight: 14,
                            }}>
                                <Plus size={24} color="#fff" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontFamily: fonts.heading.bold, color: colors.primaryForeground }}>
                                    New Conversation
                                </Text>
                                <Text style={{ fontSize: 12, fontFamily: fonts.sans.regular, color: `${colors.primaryForeground}cc` }}>
                                    Ask about ingredients & safety
                                </Text>
                            </View>
                            <ChevronRight size={20} color={`${colors.primaryForeground}90`} />
                        </TouchableOpacity>

                        {chatHistory.length > 0 && (
                            <Text style={{ fontSize: 11, fontFamily: fonts.sans.bold, color: colors.mutedForeground, letterSpacing: 1.5, marginBottom: 12 }}>
                                RECENT CHATS
                            </Text>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 40 }}>
                        <Image
                            source={require("../../assets/images/lumi-mascot.png")}
                            style={{ width: 100, height: 100, marginBottom: 16 }}
                            resizeMode="contain"
                        />
                        <Text style={{ fontSize: 17, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 6 }}>
                            No conversations yet
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: fonts.sans.regular, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 }}>
                            Start a new chat to get personalised health insights from Lumi.
                        </Text>
                    </View>
                }
            />
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar style="dark" />
            {viewMode === 'history' ? renderHistoryView() : renderChatView()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Header
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: colors.background },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
    headerTitle: { fontSize: 16, fontFamily: fonts.heading.bold, color: colors.foreground },
    headerSubtitle: { fontSize: 10, fontFamily: fonts.sans.bold, color: colors.primary, letterSpacing: 1 },
    headerCenter: { alignItems: 'center' },
    historyHeaderTitle: { fontSize: 20, fontFamily: fonts.heading.bold, color: colors.foreground },
    newChatHeaderBtn: { padding: 4 },

    profileContainer: { width: 40, alignItems: 'flex-end' },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted },
    headerAvatarFallback: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },

    // History View
    historyList: { padding: 20, paddingBottom: 40 },
    historyHeaderComponent: { marginBottom: 20 },
    startChatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: `${colors.primary}30`, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
    startChatIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    startChatTitle: { fontSize: 16, fontFamily: fonts.heading.bold, color: colors.foreground },
    startChatDesc: { fontSize: 13, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    sectionTitle: { fontSize: 12, fontFamily: fonts.sans.bold, color: colors.mutedForeground, letterSpacing: 1.5, marginBottom: 12 },

    historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: radius.xl, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    historyInfo: { flex: 1 },
    historyTitle: { fontSize: 14, fontFamily: fonts.sans.bold, color: colors.foreground, marginBottom: 4 },
    historyDate: { fontSize: 11, fontFamily: fonts.sans.regular, color: colors.mutedForeground },
    deleteBtn: { padding: 8 },
    emptyHistory: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.6 },
    emptyHistoryText: { marginTop: 16, fontSize: 16, fontFamily: fonts.sans.bold, color: colors.foreground },
    emptyHistorySub: { fontSize: 13, color: colors.mutedForeground, marginTop: 4 },

    // Chat View
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    messageContainer: { flexDirection: "row", marginBottom: 16, alignItems: "flex-end" },
    userMessageContainer: { justifyContent: "flex-end" },
    assistantMessageContainer: { justifyContent: "flex-start" },
    messageBubble: { maxWidth: "80%", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
    userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    assistantBubble: { backgroundColor: colors.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
    messageText: { fontSize: 15, fontFamily: fonts.sans.regular, lineHeight: 22 },
    userMessageText: { color: "#fff" },
    assistantMessageText: { color: colors.foreground },
    markdownContainer: { flex: 1 },
    assistantAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },

    // Product Context Card
    productContextCard: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: `${colors.primary}25`, shadowColor: colors.primary, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
    productContextHeader: { flexDirection: 'row', alignItems: 'center' },
    productContextImage: { width: 44, height: 44, borderRadius: 10, marginRight: 12, backgroundColor: colors.muted },
    productContextInfo: { flex: 1 },
    productContextName: { fontSize: 15, fontFamily: fonts.sans.bold, color: colors.foreground },
    productContextBrand: { fontSize: 12, fontFamily: fonts.sans.regular, color: colors.mutedForeground, marginTop: 2 },
    productContextBadge: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    productContextScore: { fontSize: 16, fontFamily: fonts.heading.bold },

    emptyState: { alignItems: 'center', marginTop: 40 },
    emptyIconBg: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    emptyTitle: { fontSize: 18, fontFamily: fonts.heading.bold, color: colors.foreground, marginBottom: 8 },
    emptyDesc: { fontSize: 14, fontFamily: fonts.sans.regular, color: colors.mutedForeground, textAlign: 'center', maxWidth: 260 },

    // Bottom Input
    bottomSection: { backgroundColor: colors.background, paddingTop: 10 },
    chipsScroll: { maxHeight: 50, marginBottom: 12 },
    chipsContent: { paddingHorizontal: 20, gap: 8 },
    chipButton: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    chipText: { fontSize: 12, fontFamily: fonts.sans.medium, color: colors.foreground },

    inputBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 24, padding: 8, borderWidth: 1, borderColor: colors.border, gap: 8 },
    ageSelector: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' },
    input: { flex: 1, fontSize: 15, fontFamily: fonts.sans.regular, color: colors.foreground, maxHeight: 80, paddingHorizontal: 8 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
    sendBtnDisabled: { backgroundColor: colors.muted, opacity: 0.5 },

    // Background Accents
    blurTopRight: { position: "absolute", top: -100, right: -100, width: 200, height: 200, backgroundColor: colors.accent, borderRadius: 100, opacity: 0.3 },
    blurLeft: { position: "absolute", top: "30%", left: -80, width: 160, height: 160, backgroundColor: colors.chart1, borderRadius: 80, opacity: 0.05 },
});
