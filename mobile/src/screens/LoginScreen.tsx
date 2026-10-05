import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!username || !password) {
      Alert.alert("Attention", "Please fill in all fields.");
      return;
    }

    Alert.alert("Karny", "Connection successful!");
  };

  return (
    <View style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.bigCircle} />
      <View style={styles.smallCircle} />

      {/* Top area */}
      <View style={styles.topSection}>
        <View style={styles.logoRow}>
          <View style={styles.logoBox}>
            <View style={styles.bookLeft} />
            <View style={styles.bookRight} />
            <View style={styles.bookMiddle} />
          </View>

          <View>
            <Text style={styles.logoText}>Karny</Text>
            <Text style={styles.logoSubtitle}>الكَرني</Text>
          </View>
        </View>

        <View style={styles.badge}>
          <Text style={styles.badgeCheck}>✓</Text>
          <Text style={styles.badgeText}>Your notebook, made simple</Text>
        </View>
      </View>

      <View style={styles.welcomeSection}>
        <Text style={styles.eyebrow}>A CALMER WAY TO KEEP CREDIT</Text>

        <Text style={styles.welcomeText}>Welcome back,</Text>

        <Text style={styles.welcomeAccent}>Arabi.</Text>

        <Text style={styles.description}>
          Keep track of your customers and every{"\n"}
          dirham in one clear place.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Username</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          placeholderTextColor="#A5B2B0"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#A5B2B0"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Log in</Text>

          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.bottomLine} />

        <Text style={styles.bottomText}>Trusted by neighborhood shops</Text>

        <View style={styles.bottomLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F6EF",
    paddingHorizontal: 32,
    paddingTop: 48,
    paddingBottom: 28,
    overflow: "hidden",
  },

  bigCircle: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "#EEF5F1",
    right: -45,
    top: -10,
  },

  smallCircle: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
    borderColor: "#EADFBF",
    right: -30,
    top: -5,
  },

  topSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#237A75",
    marginRight: 12,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  bookLeft: {
    width: 13,
    height: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderRightWidth: 1,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    position: "absolute",
    left: 13,
    top: 15,
  },

  bookRight: {
    width: 13,
    height: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    position: "absolute",
    right: 13,
    top: 15,
  },

  bookMiddle: {
    width: 2,
    height: 20,
    backgroundColor: "#FFFFFF",
    position: "absolute",
  },

  logoText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#173F3D",
  },

  logoSubtitle: {
    fontSize: 9,
    color: "#237A75",
    marginTop: 2,
  },

  badge: {
    backgroundColor: "#E5F2EE",
    borderWidth: 1,
    borderColor: "#D1E6E1",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  badgeCheck: {
    color: "#237A75",
    fontSize: 11,
    marginRight: 6,
  },

  badgeText: {
    color: "#237A75",
    fontSize: 7,
    fontWeight: "600",
  },

  welcomeSection: {
    marginTop: 72,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#237A75",
    marginBottom: 7,
  },

  welcomeText: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "800",
    color: "#173F3D",
  },

  welcomeAccent: {
    fontSize: 31,
    lineHeight: 34,
    fontWeight: "800",
    color: "#E8795F",
  },

  description: {
    fontSize: 12,
    lineHeight: 20,
    color: "#7B8582",
    marginTop: 14,
  },

  form: {
    marginTop: 42,
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#234542",
    marginBottom: 10,
  },

  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3DF",
    borderRadius: 17,
    paddingHorizontal: 18,
    fontSize: 12,
    color: "#173F3D",
    marginBottom: 20,
  },

  button: {
    height: 51,
    backgroundColor: "#237A75",
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  arrow: {
    position: "absolute",
    right: 18,
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "300",
  },

  bottomSection: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomLine: {
    width: 36,
    height: 1,
    backgroundColor: "#D9E1DD",
  },

  bottomText: {
    fontSize: 7,
    color: "#81918D",
    marginHorizontal: 18,
  },
});