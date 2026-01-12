import { View, Text, FlatList, TouchableOpacity, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Hospital {
    name: string;
    rating: number;
    distance_km: number;
    maps_url: string;
}

export default function Hospitals() {
    const params = useLocalSearchParams();
    // console.log("HOSPITAL PARAMS:", params);

    const router = useRouter();
    const [data, setData] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            const token = await AsyncStorage.getItem("accessToken");

            // 🔐 Not logged in → redirect
            if (!token) {
                router.replace("/auth/login");
                return;
            }

            try {
                const res = await fetch("http://10.235.152.151:8000/api/nearby-hospitals/",
                    {
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

                    }
                );

                if (res.status === 401) {
                    router.replace("/auth/login");
                    return;
                }

                const json = await res.json();
                setData(json.hospitals || []);
            } catch (err) {
                console.error("Hospital fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        checkAuthAndFetch();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Loading hospitals...</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={data}
            keyExtractor={(_, i) => i.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
                <View
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                    }}
                >
                    <Text style={{ fontWeight: "700", fontSize: 16 }}>{item.name}</Text>
                    <Text>⭐ Rating: {item.rating}</Text>
                    <Text>📍 Distance: {item.distance_km} km</Text>

                    <TouchableOpacity
                        onPress={() => Linking.openURL(item.maps_url)}
                        style={{
                            marginTop: 8,
                            backgroundColor: "#0f766e",
                            padding: 10,
                            borderRadius: 8,
                        }}
                    >
                        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
                            Get Directions
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            ListEmptyComponent={
                <View style={{ marginTop: 60, alignItems: "center" }}>
                    <Text style={{ color:"white", fontSize: 16, fontWeight: "600" }}>
                        No hospitals found
                    </Text>
                    <Text style={{ color: "#6b7280", marginTop: 6 }}>
                        Try a different location or city
                    </Text>
                </View>
            }
        />
    );
}
