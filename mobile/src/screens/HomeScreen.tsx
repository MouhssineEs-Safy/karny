import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Karny</Text>
        <Text style={styles.greeting}>Good morning</Text>
        <Text style={styles.avatar}>A</Text>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.subtitle}>YOUR SHOP AT A GLANCE</Text>
        <Text style={styles.welcome}>Welcome, Arabi 👋</Text>
        <Text style={styles.description}>Here is how things look today.</Text>
      </View>

      <View style={styles.debtCard}>
        <Text style={styles.cardLabel}>TODAY'S NOTEBOOK</Text>
        <Text style={styles.debtLabel}>Total current debt</Text>
        <Text style={styles.debtAmount}>580 DH</Text>
        <Text style={styles.customersCount}>5 customers</Text>
      </View>

      <View style={styles.customersCard}>
        <Text style={styles.customersTitle}>View customers</Text>
        <Text style={styles.customersDescription}>See who owes what</Text>
      </View>

      <View style={styles.reminder}>
        <Text style={styles.reminderTitle}>Small steps, less worry.</Text>
        <Text style={styles.reminderDescription}>
          Record a payment as soon as it happens.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F4",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 35,
  },
  logo: {
    backgroundColor: "#176B67",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    fontWeight: "bold",
  },
  greeting: {
    color: "#183F3E",
    fontWeight: "bold",
  },
  avatar: {
    backgroundColor: "#E9876B",
    color: "#FFFFFF",
    padding: 12,
    borderRadius: 30,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  subtitle: {
    color: "#D9785E",
    fontSize: 10,
    marginBottom: 8,
  },
  welcome: {
    color: "#183F3E",
    fontSize: 25,
    fontWeight: "bold",
  },
  description: {
    color: "#82918E",
    marginTop: 6,
  },
  debtCard: {
    backgroundColor: "#176B67",
    padding: 20,
    borderRadius: 22,
    marginBottom: 18,
  },
  cardLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    marginBottom: 22,
  },
  debtLabel: {
    color: "#D8E8E4",
    fontSize: 12,
  },
  debtAmount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 4,
  },
  customersCount: {
    color: "#FFFFFF",
    fontSize: 11,
    marginTop: 20,
  },
  customersCard: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 18,
    marginBottom: 15,
  },
  customersTitle: {
    color: "#183F3E",
    fontWeight: "bold",
  },
  customersDescription: {
    color: "#82918E",
    fontSize: 11,
    marginTop: 5,
  },
  reminder: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E6DC",
    borderStyle: "dashed",
  },
  reminderTitle: {
    color: "#183F3E",
    fontWeight: "bold",
    fontSize: 12,
  },
  reminderDescription: {
    color: "#82918E",
    fontSize: 10,
    marginTop: 5,
  },
});
