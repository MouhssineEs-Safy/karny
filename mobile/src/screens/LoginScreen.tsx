import React, { useState } from "react";
import { router } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../store/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (loading) return;

    const trimmedEmail = username.trim().toLowerCase();
    const trimmedName = name.trim();

    if (isRegisterMode && !trimmedName) {
      setErrorMessage("Please enter your shop or merchant name.");
      return;
    }

    if (!trimmedEmail || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (isRegisterMode && password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      if (isRegisterMode) {
        await signUp(trimmedName, trimmedEmail, password);
      } else {
        await signIn(trimmedEmail, password);
      }
      router.replace("/home");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

          <Text style={styles.welcomeText}>
            {isRegisterMode ? "Start your" : "Welcome back,"}
          </Text>

          <Text style={styles.welcomeAccent}>
            {isRegisterMode ? "notebook." : "Arabi."}
          </Text>

          <Text style={styles.description}>
            Keep track of your customers and every{"\n"}
            dirham in one clear place.
          </Text>
        </View>

        <View style={styles.form}>
          {errorMessage ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {isRegisterMode ? (
            <>
              <Text style={styles.label}>Shop / Merchant Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name or shop name"
                placeholderTextColor="#A5B2B0"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errorMessage) setErrorMessage(null);
                }}
                editable={!loading}
                accessibilityLabel="Shop or Merchant Name"
              />
            </>
          ) : null}

          <Text style={styles.label}>Username (Email)</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            keyboardType="email-address"
            placeholderTextColor="#A5B2B0"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errorMessage) setErrorMessage(null);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
            accessibilityLabel="Email address"
          />

          <Text style={styles.label}>Password</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#A5B2B0"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry
            editable={!loading}
            onSubmitEditing={handleSubmit}
            returnKeyType="go"
            accessibilityLabel="Password"
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={isRegisterMode ? "Create account" : "Log in"}
          >
            <Text style={styles.buttonText}>
              {loading
                ? isRegisterMode
                  ? "Creating account..."
                  : "Logging in..."
                : isRegisterMode
                ? "Create account"
                : "Log in"}
            </Text>

            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeSwitchButton}
            onPress={() => {
              setIsRegisterMode((prev) => !prev);
              setErrorMessage(null);
            }}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.modeSwitchText}>
              {isRegisterMode
                ? "Already have an account? Log in"
                : "New shop owner? Create an account"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.bottomLine} />

          <Text style={styles.bottomText}>Trusted by neighborhood shops</Text>

          <View style={styles.bottomLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8F6EF",
  },
  container: {
    flexGrow: 1,
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
    fontSize: 10,
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
    fontSize: 10,
    fontWeight: "600",
  },

  welcomeSection: {
    marginTop: 56,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: "#237A75",
    marginBottom: 7,
  },

  welcomeText: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "800",
    color: "#173F3D",
  },

  welcomeAccent: {
    fontSize: 31,
    lineHeight: 35,
    fontWeight: "800",
    color: "#E8795F",
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
    color: "#7B8582",
    marginTop: 14,
  },

  form: {
    marginTop: 34,
  },

  errorBanner: {
    backgroundColor: "#FCECE8",
    borderWidth: 1,
    borderColor: "#F3C1B4",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  errorBannerText: {
    color: "#B43E24",
    fontSize: 12,
    fontWeight: "600",
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#234542",
    marginBottom: 8,
  },

  input: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3DF",
    borderRadius: 17,
    paddingHorizontal: 18,
    fontSize: 14,
    color: "#173F3D",
    marginBottom: 18,
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

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  arrow: {
    position: "absolute",
    right: 18,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "400",
  },

  modeSwitchButton: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 6,
  },

  modeSwitchText: {
    color: "#237A75",
    fontSize: 12,
    fontWeight: "700",
  },

  bottomSection: {
    marginTop: "auto",
    paddingTop: 24,
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
    fontSize: 10,
    color: "#81918D",
    marginHorizontal: 14,
  },
});