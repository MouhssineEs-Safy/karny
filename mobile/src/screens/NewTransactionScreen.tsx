import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createCustomerTransaction,
  getCustomerById,
  getCustomers,
} from "../services/api";
import type { Customer, TransactionType } from "../types/karny";
import {
  formatCurrency,
  formatSlashDate,
  getInitials,
  parseCurrencyInput,
} from "../utils/formatters";

export default function NewTransactionScreen() {
  const params = useLocalSearchParams<{
    customerId?: string;
    customerName?: string;
    type?: string;
  }>();

  const initialCustomerId = params.customerId
    ? Number(params.customerId)
    : null;
  const initialType: TransactionType =
    params.type === "payment" ? "payment" : "credit";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    initialCustomerId && params.customerName
      ? {
          id: initialCustomerId,
          name: params.customerName,
          phone: "",
          amount: "0.00",
          user_id: 0,
        }
      : null
  );
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  const [transactionType, setTransactionType] =
    useState<TransactionType>(initialType);
  const [amountText, setAmountText] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomerOptions() {
      setLoadingCustomers(true);
      try {
        const list = await getCustomers();
        if (!isMounted) return;
        const safeList = Array.isArray(list) ? list : [];
        setCustomers(safeList);

        if (initialCustomerId && Number.isInteger(initialCustomerId)) {
          const match = safeList.find((c) => c.id === initialCustomerId);
          if (match) {
            setSelectedCustomer(match);
          } else {
            try {
              const single = await getCustomerById(initialCustomerId);
              if (isMounted && single) {
                setSelectedCustomer(single);
              }
            } catch {
              // Keep fallback if network failed
            }
          }
        } else if (safeList.length > 0) {
          setSelectedCustomer((prev) => prev ?? safeList[0]);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Could not load customers."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingCustomers(false);
        }
      }
    }

    void loadCustomerOptions();

    return () => {
      isMounted = false;
    };
  }, [initialCustomerId]);

  const handleBack = () => {
    if (submitting) return;
    if (router.canGoBack()) {
      router.back();
    } else if (selectedCustomer?.id) {
      router.replace({
        pathname: "/customers/[id]",
        params: { id: String(selectedCustomer.id) },
      });
    } else {
      router.replace("/customers");
    }
  };

  const handleSaveTransaction = async () => {
    if (submitting) return;

    if (!selectedCustomer || !selectedCustomer.id) {
      setErrorMessage("Please select a customer first.");
      return;
    }

    const parsedAmount = parseCurrencyInput(amountText);
    if (parsedAmount === null || parsedAmount <= 0) {
      setErrorMessage(
        "Please enter a valid positive amount (up to 2 decimal places)."
      );
      return;
    }

    const currentCustomerDebt = Number(selectedCustomer.amount);
    if (
      transactionType === "payment" &&
      Number.isFinite(currentCustomerDebt) &&
      selectedCustomer.user_id !== 0 &&
      parsedAmount > currentCustomerDebt
    ) {
      setErrorMessage(
        `Payment amount cannot exceed ${selectedCustomer.name}'s current debt (${formatCurrency(
          currentCustomerDebt
        )}).`
      );
      return;
    }

    const trimmedNote = noteText.trim();
    if (trimmedNote.length > 500) {
      setErrorMessage("Note cannot exceed 500 characters.");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await createCustomerTransaction(selectedCustomer.id, {
        type: transactionType,
        amount: parsedAmount,
        note: trimmedNote || undefined,
      });

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace({
          pathname: "/customers/[id]",
          params: { id: String(selectedCustomer.id) },
        });
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not save transaction. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isCredit = transactionType === "credit";
  const isPayment = transactionType === "payment";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBackButton}
              onPress={handleBack}
              disabled={submitting}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>New transaction</Text>
              <Text style={styles.headerSubtitle}>
                Add it in a few seconds
              </Text>
            </View>

            <View style={styles.headerRightSpacer} />
          </View>

          {/* Intro */}
          <View style={styles.introSection}>
            <Text style={styles.eyebrow}>WRITING IN THE NOTEBOOK</Text>
            <Text style={styles.heading}>One simple</Text>
            <Text style={styles.headingAccent}>entry.</Text>
          </View>

          {/* Error Banner */}
          {errorMessage ? (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Customer Selector / Confirmation Card */}
          <TouchableOpacity
            style={styles.customerCard}
            onPress={() => {
              if (!submitting && customers.length > 0) {
                setPickerVisible(true);
              }
            }}
            activeOpacity={0.8}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel={
              selectedCustomer
                ? `Selected customer ${selectedCustomer.name}. Tap to change.`
                : "Select a customer"
            }
          >
            <View style={styles.customerAvatar}>
              {loadingCustomers && !selectedCustomer ? (
                <ActivityIndicator size="small" color="#237A75" />
              ) : (
                <Text style={styles.customerAvatarText}>
                  {getInitials(selectedCustomer?.name || "C")}
                </Text>
              )}
            </View>

            <View style={styles.customerCardInfo}>
              <Text style={styles.customerLabel}>Customer</Text>
              <Text style={styles.customerName} numberOfLines={1}>
                {selectedCustomer
                  ? selectedCustomer.name
                  : loadingCustomers
                  ? "Loading customer..."
                  : "Tap to select customer"}
              </Text>
              {selectedCustomer && selectedCustomer.user_id !== 0 ? (
                <Text style={styles.customerBalanceHint}>
                  Current debt: {formatCurrency(selectedCustomer.amount)}
                </Text>
              ) : null}
            </View>

            <Text style={styles.customerCheckmark}>✓</Text>
          </TouchableOpacity>

          {/* Transaction Type */}
          <Text style={styles.sectionLabel}>Transaction type</Text>

          <View style={styles.typeRow}>
            {/* Credit Option */}
            <TouchableOpacity
              style={[
                styles.typeCard,
                isCredit && styles.typeCardCreditActive,
              ]}
              onPress={() => {
                setTransactionType("credit");
                if (errorMessage) setErrorMessage(null);
              }}
              activeOpacity={0.85}
              disabled={submitting}
              accessibilityRole="radio"
              accessibilityState={{ checked: isCredit }}
              accessibilityLabel="Credit: They take now"
            >
              <View style={styles.typeCardInner}>
                <View style={styles.typeIconCreditBadge}>
                  <View style={styles.creditMiniCard}>
                    <View style={styles.creditMiniStripe} />
                  </View>
                </View>

                <View style={styles.typeTextCol}>
                  <Text style={styles.typeTitle}>Credit</Text>
                  <Text style={styles.typeSubtitle}>They take now</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Payment Option */}
            <TouchableOpacity
              style={[
                styles.typeCard,
                isPayment && styles.typeCardPaymentActive,
              ]}
              onPress={() => {
                setTransactionType("payment");
                if (errorMessage) setErrorMessage(null);
              }}
              activeOpacity={0.85}
              disabled={submitting}
              accessibilityRole="radio"
              accessibilityState={{ checked: isPayment }}
              accessibilityLabel="Payment: They pay back"
            >
              <View style={styles.typeCardInner}>
                <View style={styles.typeIconPaymentBadge}>
                  <Text style={styles.paymentMiniIcon}>₪</Text>
                </View>

                <View style={styles.typeTextCol}>
                  <Text style={styles.typeTitle}>Payment</Text>
                  <Text style={styles.typeSubtitle}>They pay back</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Text style={styles.sectionLabel}>Amount</Text>

          <View style={styles.amountCard}>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor="#B5C0BD"
              keyboardType="decimal-pad"
              value={amountText}
              onChangeText={(val) => {
                setAmountText(val);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!submitting}
              accessibilityLabel="Transaction amount in Dirhams"
            />
            <Text style={styles.amountCurrency}>DH</Text>
          </View>

          {/* Date Display */}
          <Text style={styles.sectionLabel}>Date</Text>

          <View style={styles.dateCard}>
            <View style={styles.calendarIcon}>
              <View style={styles.calendarTopBar} />
            </View>

            <Text style={styles.dateValue}>{formatSlashDate()}</Text>

            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Today</Text>
            </View>
          </View>

          {/* Optional Note Input */}
          <Text style={styles.sectionLabel}>Note (optional)</Text>

          <View style={styles.noteCard}>
            <TextInput
              style={styles.noteInput}
              placeholder="Add a short note (e.g. groceries, cash payment)"
              placeholderTextColor="#A5B2B0"
              value={noteText}
              onChangeText={(val) => {
                setNoteText(val);
                if (errorMessage) setErrorMessage(null);
              }}
              editable={!submitting}
              maxLength={500}
              accessibilityLabel="Transaction note"
            />
          </View>

          {/* Save Transaction Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              submitting && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveTransaction}
            disabled={submitting}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Save transaction"
          >
            <Text style={styles.saveCheck}>✓</Text>
            <Text style={styles.saveButtonText}>
              {submitting ? "Saving transaction..." : "Save transaction"}
            </Text>
            <Text style={styles.saveArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.footerCaption}>
            Your changes are saved safely on this device.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Customer Picker Modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setPickerVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select customer</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setPickerVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalList}>
              {customers.map((c) => {
                const isSelected = selectedCustomer?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.modalCustomerItem,
                      isSelected && styles.modalCustomerItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCustomer(c);
                      setPickerVisible(false);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>
                        {getInitials(c.name)}
                      </Text>
                    </View>
                    <View style={styles.modalCustomerInfo}>
                      <Text style={styles.modalCustomerName}>{c.name}</Text>
                      <Text style={styles.modalCustomerSub}>
                        Debt: {formatCurrency(c.amount)}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Text style={styles.customerCheckmark}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F4",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 32,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBackButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EAF1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    color: "#173F3D",
    fontSize: 18,
    fontWeight: "700",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#173F3D",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#7B8582",
    marginTop: 2,
  },
  headerRightSpacer: {
    width: 42,
  },

  introSection: {
    marginTop: 26,
    marginBottom: 18,
  },
  eyebrow: {
    color: "#E8795F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  heading: {
    color: "#173F3D",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  headingAccent: {
    color: "#E8795F",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },

  errorBanner: {
    backgroundColor: "#FCECE8",
    borderWidth: 1,
    borderColor: "#F3C1B4",
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  errorBannerText: {
    color: "#B43E24",
    fontSize: 12,
    fontWeight: "600",
  },

  customerCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#DCEEEB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  customerAvatarText: {
    color: "#237A75",
    fontSize: 13,
    fontWeight: "800",
  },
  customerCardInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerLabel: {
    fontSize: 10,
    color: "#8C9A96",
  },
  customerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#173F3D",
    marginTop: 2,
  },
  customerBalanceHint: {
    fontSize: 11,
    color: "#7B8582",
    marginTop: 2,
  },
  customerCheckmark: {
    color: "#237A75",
    fontSize: 16,
    fontWeight: "800",
    marginLeft: 6,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#173F3D",
    marginTop: 20,
    marginBottom: 10,
  },

  typeRow: {
    flexDirection: "row",
    gap: 12,
  },
  typeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  typeCardCreditActive: {
    backgroundColor: "#FDF6F3",
    borderColor: "#F3C1B4",
    borderWidth: 1.5,
  },
  typeCardPaymentActive: {
    backgroundColor: "#F1F9F7",
    borderColor: "#8CC6BE",
    borderWidth: 1.5,
  },
  typeCardInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIconCreditBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#FCE5DE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  creditMiniCard: {
    width: 15,
    height: 11,
    borderWidth: 1.4,
    borderColor: "#E8795F",
    borderRadius: 2,
  },
  creditMiniStripe: {
    width: "100%",
    height: 2.5,
    backgroundColor: "#E8795F",
    marginTop: 2,
  },
  typeIconPaymentBadge: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#E4F2EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  paymentMiniIcon: {
    color: "#237A75",
    fontSize: 15,
    fontWeight: "800",
  },
  typeTextCol: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#173F3D",
  },
  typeSubtitle: {
    fontSize: 10,
    color: "#8C9A96",
    marginTop: 2,
  },

  amountCard: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "#173F3D",
  },
  amountCurrency: {
    fontSize: 14,
    fontWeight: "800",
    color: "#237A75",
    marginLeft: 8,
  },

  dateCard: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  calendarIcon: {
    width: 18,
    height: 18,
    borderWidth: 1.6,
    borderColor: "#237A75",
    borderRadius: 4,
    marginRight: 12,
    overflow: "hidden",
  },
  calendarTopBar: {
    width: "100%",
    height: 5,
    borderBottomWidth: 1.4,
    borderBottomColor: "#237A75",
  },
  dateValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#173F3D",
  },
  todayBadge: {
    backgroundColor: "#E4F2EF",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  todayBadgeText: {
    color: "#237A75",
    fontSize: 10,
    fontWeight: "700",
  },

  noteCard: {
    height: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 16,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  noteInput: {
    fontSize: 13,
    color: "#173F3D",
  },

  saveButton: {
    height: 54,
    backgroundColor: "#216E69",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 26,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveCheck: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  saveArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },

  footerCaption: {
    fontSize: 10,
    color: "#8C9A96",
    textAlign: "center",
    marginTop: 14,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(23, 63, 61, 0.45)",
  },
  modalSheet: {
    backgroundColor: "#FAF9F4",
    borderRadius: 22,
    padding: 20,
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: "#E6E8E2",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#173F3D",
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAF1EE",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    color: "#173F3D",
    fontSize: 13,
    fontWeight: "700",
  },
  modalList: {
    marginTop: 4,
  },
  modalCustomerItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E6E8E2",
  },
  modalCustomerItemSelected: {
    borderColor: "#237A75",
    backgroundColor: "#F2F9F7",
  },
  modalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#DCEEEB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  modalAvatarText: {
    color: "#237A75",
    fontSize: 12,
    fontWeight: "800",
  },
  modalCustomerInfo: {
    flex: 1,
  },
  modalCustomerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173F3D",
  },
  modalCustomerSub: {
    fontSize: 11,
    color: "#7B8582",
    marginTop: 2,
  },
});
