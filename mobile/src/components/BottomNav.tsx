import React from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface BottomNavProps {
  activeTab: "home" | "customers";
}

export default function BottomNav({ activeTab }: BottomNavProps) {
  const isHome = activeTab === "home";
  const isCustomers = activeTab === "customers";

  return (
    <View style={styles.bottomNavigation}>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Go to Home"
        onPress={() => {
          if (!isHome) {
            router.replace("/home");
          }
        }}
      >
        <Text style={isHome ? styles.navIconActive : styles.navIcon}>⌂</Text>
        <Text style={isHome ? styles.navTextActive : styles.navText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Go to Customers"
        onPress={() => {
          if (!isCustomers) {
            router.replace("/customers");
          }
        }}
      >
        <Text style={isCustomers ? styles.navIconActive : styles.navIcon}>
          ♧
        </Text>
        <Text style={isCustomers ? styles.navTextActive : styles.navText}>
          Customers
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: {
    height: 60,
    borderTopWidth: 1,
    borderTopColor: "#E9E7DF",
    backgroundColor: "#FAF9F4",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  navIcon: {
    fontSize: 18,
    color: "#9BA7A3",
  },
  navIconActive: {
    fontSize: 19,
    color: "#237A75",
  },
  navText: {
    fontSize: 11,
    color: "#9BA7A3",
    marginTop: 2,
  },
  navTextActive: {
    fontSize: 11,
    fontWeight: "700",
    color: "#237A75",
    marginTop: 2,
  },
});
