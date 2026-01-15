import { View, Text, FlatList, TouchableOpacity, Linking, StyleSheet, Animated, Dimensions, StatusBar, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Premium gradients
import { SafeAreaView } from "react-native-safe-area-context"; // Better notch handling
import { DJANGO_API } from "@/constants/api";

const { width } = Dimensions.get("window");

interface Hospital {
    name: string;
    rating: number;
    distance_km: number;
    maps_url: string;
}

// --- ANIMATED CARD COMPONENT ---
const HospitalCard = ({ item, index }: { item: Hospital; index: number }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 100, // Staggered effect
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.cardContainer, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            <View style={styles.cardContent}>
                {/* Header: Icon + Name */}
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <FontAwesome5 name="hospital" size={22} color="#0f766e" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.hospitalName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.cityText}>Medical Center</Text>
                    </View>
                </View>

                {/* Info Badges */}
                <View style={styles.badgeRow}>
                    <View style={[styles.badge, styles.ratingBadge]}>
                        <Ionicons name="star" size={14} color="#B45309" />
                        <Text style={styles.ratingText}>{item.rating}</Text>
                    </View>
                    
                    <View style={[styles.badge, styles.distanceBadge]}>
                        <MaterialCommunityIcons name="map-marker-distance" size={14} color="#0f766e" />
                        <Text style={styles.distanceText}>{item.distance_km.toFixed(1)} km away</Text>
                    </View>
                </View>

                {/* Gradient Button */}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => Linking.openURL(item.maps_url)}
                    style={styles.buttonWrapper}
                >
                    <LinearGradient
                        colors={['#0f766e', '#115e59']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.buttonText}>Get Directions</Text>
                        <MaterialCommunityIcons name="navigation-variant" size={18} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

// --- SKELETON LOADER COMPONENT ---
const SkeletonCard = () => {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={[styles.cardContainer, { opacity, height: 180 }]}>
            <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ width: 45, height: 45, borderRadius: 12, backgroundColor: '#E2E8F0' }} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <View style={{ width: '80%', height: 20, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
                        <View style={{ width: '40%', height: 14, borderRadius: 4, backgroundColor: '#E2E8F0' }} />
                    </View>
                </View>
                <View style={{ width: '100%', height: 45, borderRadius: 12, backgroundColor: '#E2E8F0' }} />
            </View>
        </Animated.View>
    );
};

export default function Hospitals() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const [data, setData] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const token = await AsyncStorage.getItem("accessToken");

            if (!token) {
                router.replace("/auth/login");
                return;
            }

            try {
                // await new Promise(r => setTimeout(r, 1500)); // Uncomment to see skeleton effect
                const res = await fetch(`${DJANGO_API.BASE_URL}/api/nearby-hospitals/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        diagnosis: params.diagnosis,
                        lat: params.lat ? Number(params.lat) : undefined,
                        lon: params.lon ? Number(params.lon) : undefined,
                        city: params.city || undefined,
                        sort: "rating",
                    }),
                });

                if (res.status === 401) return router.replace("/auth/login");
                const json = await res.json();
                setData(json.hospitals || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, []);

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" backgroundColor="#0f766e" />
            
            {/* Background Header Decoration */}
            <View style={styles.topDecoration}>
                <LinearGradient
                    colors={['#0f766e', '#0d9488']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                         <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.screenTitle}>Nearby Care</Text>
                        <Text style={styles.screenSubtitle}>Based on your diagnosis</Text>
                    </View>
                </View>
            </View>

            {/* List Content */}
            <View style={styles.listContainer}>
                {loading ? (
                    <View style={{ padding: 20 }}>
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </View>
                ) : (
                    <FlatList
                        data={data}
                        keyExtractor={(_, i) => i.toString()}
                        contentContainerStyle={styles.flatListContent}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => <HospitalCard item={item} index={index} />}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <MaterialCommunityIcons name="hospital" size={60} color="#94A3B8" />
                                <Text style={styles.emptyText}>No hospitals found nearby</Text>
                                <Text style={styles.emptySubText}>Try changing your location settings</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: "#F1F5F9",
    },
    topDecoration: {
        height: 100,
        paddingTop: Platform.OS === 'android' ? 10 : 50,
        paddingHorizontal: 20,
        justifyContent: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 55,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
    },
    screenSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    listContainer: {
        flex: 1,
        marginTop: -20, // Pull list up to overlap header
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: "#F1F5F9",
        overflow: 'hidden',
    },
    flatListContent: {
        padding: 20,
        paddingTop: 20,
    },
    // Card Styles
    cardContainer: {
        marginBottom: 16,
        borderRadius: 20,
        backgroundColor: '#fff',
        // Premium Shadow
        shadowColor: "#0f766e",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    cardContent: {
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F0FDFA',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CCFBF1',
    },
    headerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    hospitalName: {
        fontSize: 17,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    cityText: {
        fontSize: 13,
        color: '#64748B',
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    ratingBadge: {
        backgroundColor: '#FEF3C7', // Light yellow
    },
    ratingText: {
        fontWeight: '700',
        color: '#92400E',
        fontSize: 13,
    },
    distanceBadge: {
        backgroundColor: '#E2E8F0', // Light slate
    },
    distanceText: {
        fontWeight: '600',
        color: '#475569',
        fontSize: 13,
    },
    buttonWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    // Empty State
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#475569',
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
    },
});