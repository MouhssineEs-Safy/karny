import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AuthProvider, useAuth } from "../store/AuthContext";

function RootNavigator() {
  const { isAuthenticated, isInitializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isInitializing) return;

    const firstSegment = segments[0] as string | undefined;
    const isOnLoginRoute =
      firstSegment === "login" || firstSegment === undefined;

    if (!isAuthenticated && !isOnLoginRoute) {
      router.replace("/login");
    } else if (isAuthenticated && isOnLoginRoute) {
      router.replace("/home");
    }
  }, [isAuthenticated, isInitializing, segments, router]);

  if (isInitializing) {
    return (
      <View style={styles.loadingScreen}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>Karny</Text>
        </View>
        <ActivityIndicator
          size="small"
          color="#237A75"
          style={styles.spinner}
        />
        <Text style={styles.loadingCaption}>Opening your notebook...</Text>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FAF9F4" },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#FAF9F4",
    alignItems: "center",
    justifyContent: "center",
  },
  logoBadge: {
    backgroundColor: "#237A75",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 16,
  },
  logoText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },
  spinner: {
    marginTop: 18,
  },
  loadingCaption: {
    color: "#7B8582",
    fontSize: 12,
    marginTop: 10,
  },
});
