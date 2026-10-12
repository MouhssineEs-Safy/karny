import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { Customer, CustomerInput } from "../types/karny";
import { formatAmountNumber, parseCurrencyInput } from "../utils/formatters";

const PHONE_REGEX = /^[0-9+\-\s()]{3,20}$/;

interface CustomerFormModalProps {
  visible: boolean;
  initialCustomer?: Customer | null;
  onClose: () => void;
  onSubmit: (input: CustomerInput) => Promise<void>;
}

export default function CustomerFormModal({
  visible,
  initialCustomer,
  onClose,
  onSubmit,
}: CustomerFormModalProps) {
  const isEditing = Boolean(initialCustomer);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amountText, setAmountText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (initialCustomer) {
        setName(initialCustomer.name);
        setPhone(initialCustomer.phone);
        setAmountText(formatAmountNumber(initialCustomer.amount));
      } else {
        setName("");
        setPhone("");
        setAmountText("");
      }
      setErrorMessage(null);
      setSubmitting(false);
    }
  }, [visible, initialCustomer]);

  const handleSave = async () => {
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedAmount = amountText.trim();

    if (!trimmedName || trimmedName.length > 100) {
      setErrorMessage("Please enter a valid customer name (1–100 characters).");
      return;
    }

    if (
      !trimmedPhone ||
      trimmedPhone.length > 20 ||
      !PHONE_REGEX.test(trimmedPhone)
    ) {
      setErrorMessage(
        "Please enter a valid phone number (3–20 digits, e.g. +212 6 12 34 56 78)."
      );
      return;
    }

    let parsedAmount = 0;
    if (trimmedAmount !== "") {
      const parsed = parseCurrencyInput(trimmedAmount);
      if (parsed === null) {
        setErrorMessage(
          "Please enter a valid non-negative amount (up to 2 decimal places)."
        );
        return;
      }
      parsedAmount = parsed;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await onSubmit({
        name: trimmedName,
        phone: trimmedPhone,
        amount: parsedAmount,
      });
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not save customer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!submitting) onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            if (!submitting) onClose();
          }}
        />
        <View style={styles.sheet}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.eyebrow}>
                  {isEditing ? "UPDATE NOTEBOOK ENTRY" : "NEW NOTEBOOK ENTRY"}
                </Text>
                <Text style={styles.sheetTitle}>
                  {isEditing ? "Edit customer" : "Add customer"}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel="Close customer form"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mohamed El Idrissi"
              placeholderTextColor="#A5B2B0"
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!submitting}
              maxLength={100}
            />

            <Text style={styles.label}>Phone number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. +212 6 12 34 56 78"
              placeholderTextColor="#A5B2B0"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!submitting}
              maxLength={20}
            />

            <Text style={styles.label}>
              {isEditing ? "Current debt (DH)" : "Opening debt (DH, optional)"}
            </Text>
            <View style={styles.amountInputWrapper}>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#A5B2B0"
                keyboardType="decimal-pad"
                value={amountText}
                onChangeText={(val) => {
                  setAmountText(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                editable={!submitting}
              />
              <Text style={styles.currencySuffix}>DH</Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  submitting && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <Text style={styles.saveButtonText}>
                  {submitting
                    ? "Saving..."
                    : isEditing
                    ? "Save changes"
                    : "Add customer"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(23, 63, 61, 0.45)",
  },
  sheet: {
    backgroundColor: "#FAF9F4",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E6E8E2",
    maxHeight: "88%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eyebrow: {
    color: "#E8795F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  sheetTitle: {
    color: "#173F3D",
    fontSize: 22,
    fontWeight: "800",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#E8F0ED",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#173F3D",
    fontSize: 14,
    fontWeight: "700",
  },
  errorBox: {
    backgroundColor: "#FCECE8",
    borderWidth: 1,
    borderColor: "#F3C1B4",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorText: {
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
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3DF",
    borderRadius: 15,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#173F3D",
    marginBottom: 16,
  },
  amountInputWrapper: {
    height: 48,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE3DF",
    borderRadius: 15,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  amountInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#173F3D",
  },
  currencySuffix: {
    fontSize: 13,
    fontWeight: "800",
    color: "#237A75",
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D6DFDC",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#53635F",
    fontSize: 13,
    fontWeight: "700",
  },
  saveButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#237A75",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
