import React, { useCallback, useState } from "react";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomerFormModal from "../components/CustomerFormModal";
import {
  getCustomerTransactions,
  updateCustomer,
} from "../services/api";
import type {
  Customer,
  CustomerInput,
  CustomerTransactionsSummary,
  Transaction,
} from "../types/karny";
import {
  formatActivityDate,
  formatCurrency,
  formatShortDate,
  getInitials,
} from "../utils/formatters";

export default function CustomerDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const customerId = Number(params.id);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [summary, setSummary] = useState<CustomerTransactionsSummary | null>(
    null
  );
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);

  const loadCustomerDetails = useCallback(
    async (isRefresh = false) => {
      if (!Number.isInteger(customerId) || customerId <= 0) {
        setErrorMessage("Invalid customer ID.");
        setLoading(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErrorMessage(null);

      try {
        const data = await getCustomerTransactions(customerId);
        setCustomer(data.customer);
        setSummary(data.summary);
        setTransactions(
          Array.isArray(data.transactions) ? data.transactions : []
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load customer details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [customerId]
  );

  useFocusEffect(
    useCallback(() => {
      void loadCustomerDetails(false);
    }, [loadCustomerDetails])
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/customers");
    }
  };

  const handleUpdateCustomer = async (input: CustomerInput) => {
    if (!customer) return;
    await updateCustomer(customer.id, input);
    await loadCustomerDetails(false);
  };

  const handleAddTransaction = () => {
    if (!customer) return;
    router.push({
      pathname: "/transactions/new",
      params: {
        customerId: String(customer.id),
        customerName: customer.name,
      },
    });
  };

  const currentDebt = customer ? Number(customer.amount) : 0;
  const latestActivityIso =
    transactions.length > 0 ? transactions[0].created_at : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainWrapper}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void loadCustomerDetails(true)}
              tintColor="#237A75"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={handleBack}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Customer details</Text>
              <Text style={styles.headerSubtitle}>Your notebook entry</Text>
            </View>

            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => {
                if (customer) setEditModalVisible(true);
              }}
              disabled={!customer}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Edit customer"
            >
              <View style={styles.notebookIconBox}>
                <View style={styles.notebookIconTopBar} />
              </View>
            </TouchableOpacity>
          </View>

          {loading && !customer ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="small" color="#237A75" />
              <Text style={styles.stateText}>Loading customer notebook...</Text>
            </View>
          ) : errorMessage && !customer ? (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Text style={styles.errorTitle}>Unable to load customer</Text>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => void loadCustomerDetails(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : customer ? (
            <>
              {/* Inline error banner if refresh failed while customer is already loaded */}
              {errorMessage ? (
                <View style={styles.inlineErrorBanner}>
                  <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                  <TouchableOpacity
                    onPress={() => void loadCustomerDetails(false)}
                  >
                    <Text style={styles.inlineRetryLink}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* Centered Customer Profile */}
              <View style={styles.profileSection}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {getInitials(customer.name)}
                  </Text>
                </View>

                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerPhone}>{customer.phone}</Text>

                <View style={styles.trustedBadge}>
                  <Text style={styles.trustedCheck}>✓</Text>
                  <Text style={styles.trustedText}>Trusted customer</Text>
                </View>
              </View>

              {/* Current Debt Card (Warm Amber / Gold) */}
              <View style={styles.debtCard}>
                <Text style={styles.debtCardEyebrow}>CURRENT DEBT</Text>
                <Text style={styles.debtCardAmount}>
                  {formatCurrency(customer.amount)}
                </Text>

                <View style={styles.debtCardFooter}>
                  <Text style={styles.lastActivityText}>
                    {formatActivityDate(latestActivityIso)}
                  </Text>

                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      {currentDebt > 0 ? "Needs payment" : "Settled"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Paper Trail / Transactions Section */}
              <View style={styles.transactionsSection}>
                <Text style={styles.paperTrailEyebrow}>THE PAPER TRAIL</Text>

                <View style={styles.transactionsHeaderRow}>
                  <Text style={styles.transactionsTitle}>Transactions</Text>
                  <Text style={styles.transactionsCount}>
                    {summary ? summary.transaction_count : transactions.length}{" "}
                    {(summary
                      ? summary.transaction_count
                      : transactions.length) === 1
                      ? "entry"
                      : "entries"}
                  </Text>
                </View>

                {transactions.length === 0 ? (
                  <View style={styles.emptyTransactionsBox}>
                    <Text style={styles.emptyTransactionsTitle}>
                      No entries yet
                    </Text>
                    <Text style={styles.emptyTransactionsSubtitle}>
                      Tap &ldquo;Add transaction&rdquo; below to record credit or
                      a payment for {customer.name}.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.transactionsList}>
                    {transactions.map((tx) => {
                      const isPayment = tx.type === "payment";
                      return (
                        <View key={tx.id} style={styles.transactionRow}>
                          <View
                            style={[
                              styles.txIconCircle,
                              isPayment
                                ? styles.txIconPayment
                                : styles.txIconCredit,
                            ]}
                          >
                            {isPayment ? (
                              <Text style={styles.paymentIconSymbol}>₪</Text>
                            ) : (
                              <View style={styles.creditCardIcon}>
                                <View style={styles.creditCardIconStripe} />
                              </View>
                            )}
                          </View>

                          <View style={styles.txInfo}>
                            <Text style={styles.txTypeTitle}>
                              {isPayment ? "Payment" : "Credit"}
                            </Text>
                            <Text style={styles.txDateText} numberOfLines={1}>
                              {formatShortDate(tx.created_at)}
                              {tx.note ? ` • ${tx.note}` : ""}
                            </Text>
                          </View>

                          <Text
                            style={
                              isPayment
                                ? styles.txAmountPayment
                                : styles.txAmountCredit
                            }
                          >
                            {isPayment ? "-" : "+"}
                            {formatCurrency(tx.amount)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          ) : null}
        </ScrollView>

        {/* Bottom CTA Button */}
        {customer ? (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.addTransactionButton}
              onPress={handleAddTransaction}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={`Add transaction for ${customer.name}`}
            >
              <Text style={styles.addTransactionPlus}>+</Text>
              <Text style={styles.addTransactionText}>Add transaction</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <CustomerFormModal
        visible={editModalVisible}
        initialCustomer={customer}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleUpdateCustomer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F4",
  },
  mainWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 22,
    paddingTop: 44,
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerIconButton: {
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
  notebookIconBox: {
    width: 18,
    height: 14,
    borderWidth: 1.6,
    borderColor: "#173F3D",
    borderRadius: 3,
    overflow: "hidden",
  },
  notebookIconTopBar: {
    width: "100%",
    height: 4,
    borderBottomWidth: 1.4,
    borderBottomColor: "#173F3D",
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

  stateBox: {
    marginTop: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6E8E2",
    padding: 32,
    alignItems: "center",
  },
  stateText: {
    color: "#7B8582",
    fontSize: 13,
    marginTop: 12,
  },
  errorBox: {
    marginTop: 40,
    backgroundColor: "#FCECE8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#F3C1B4",
    padding: 24,
    alignItems: "center",
  },
  errorTitle: {
    color: "#8E2B15",
    fontSize: 15,
    fontWeight: "800",
  },
  errorText: {
    color: "#B43E24",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#E8795F",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  inlineErrorBanner: {
    marginTop: 14,
    backgroundColor: "#FCECE8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inlineErrorText: {
    color: "#B43E24",
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  inlineRetryLink: {
    color: "#8E2B15",
    fontSize: 12,
    fontWeight: "800",
  },

  profileSection: {
    alignItems: "center",
    marginTop: 28,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: "#DCEEEB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: {
    color: "#237A75",
    fontSize: 18,
    fontWeight: "800",
  },
  customerName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#173F3D",
    marginTop: 14,
    textAlign: "center",
  },
  customerPhone: {
    fontSize: 12,
    color: "#8C9A96",
    marginTop: 5,
  },
  trustedBadge: {
    backgroundColor: "#E5F2EE",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  trustedCheck: {
    color: "#237A75",
    fontSize: 11,
    fontWeight: "800",
    marginRight: 6,
  },
  trustedText: {
    color: "#237A75",
    fontSize: 11,
    fontWeight: "700",
  },

  debtCard: {
    backgroundColor: "#F5DFA6",
    borderRadius: 22,
    padding: 20,
    marginTop: 24,
  },
  debtCardEyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "#8A6220",
    letterSpacing: 0.6,
  },
  debtCardAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#4D340C",
    marginTop: 6,
  },
  debtCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  lastActivityText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6E501E",
  },
  statusPill: {
    backgroundColor: "#FAF0D4",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusPillText: {
    color: "#8C5828",
    fontSize: 10,
    fontWeight: "700",
  },

  transactionsSection: {
    marginTop: 24,
  },
  paperTrailEyebrow: {
    color: "#E8795F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  transactionsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#173F3D",
  },
  transactionsCount: {
    fontSize: 11,
    color: "#7B8582",
    fontWeight: "600",
  },
  emptyTransactionsBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E6E8E2",
    padding: 24,
    alignItems: "center",
    marginTop: 4,
  },
  emptyTransactionsTitle: {
    color: "#173F3D",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyTransactionsSubtitle: {
    color: "#8C9A96",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  transactionsList: {
    marginTop: 2,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EFECE4",
  },
  txIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  txIconPayment: {
    backgroundColor: "#E4F2EF",
  },
  txIconCredit: {
    backgroundColor: "#FCECE8",
  },
  paymentIconSymbol: {
    color: "#237A75",
    fontSize: 16,
    fontWeight: "800",
  },
  creditCardIcon: {
    width: 17,
    height: 12,
    borderWidth: 1.5,
    borderColor: "#E8795F",
    borderRadius: 2.5,
    justifyContent: "flex-start",
  },
  creditCardIconStripe: {
    width: "100%",
    height: 3,
    backgroundColor: "#E8795F",
    marginTop: 2,
  },
  txInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  txTypeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#173F3D",
  },
  txDateText: {
    fontSize: 11,
    color: "#94A09D",
    marginTop: 3,
  },
  txAmountPayment: {
    fontSize: 13,
    fontWeight: "800",
    color: "#237A75",
  },
  txAmountCredit: {
    fontSize: 13,
    fontWeight: "800",
    color: "#E8795F",
  },

  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 22,
    backgroundColor: "#FAF9F4",
  },
  addTransactionButton: {
    height: 54,
    borderRadius: 18,
    backgroundColor: "#216E69",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addTransactionPlus: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "300",
    marginRight: 10,
    lineHeight: 26,
  },
  addTransactionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
