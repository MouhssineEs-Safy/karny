import React, { useCallback, useState } from "react";
import { router, useFocusEffect } from "expo-router";
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
import BottomNav from "../components/BottomNav";
import { getDashboard } from "../services/api";
import { useAuth } from "../store/AuthContext";
import type { DashboardSummary } from "../types/karny";
import {
  formatCurrency,
  formatShortDate,
  getFirstName,
  getGreetingByHour,
  getInitials,
} from "../utils/formatters";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await getDashboard(5);
      setDashboard(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load dashboard summary."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard(false);
    }, [loadDashboard])
  );

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const displayName = getFirstName(user?.name);
  const avatarInitials = getInitials(user?.name || "Merchant");
  const totalDebtText = dashboard
    ? formatCurrency(dashboard.total_outstanding_debt)
    : "0 DH";
  const totalCustomers = dashboard ? dashboard.total_customers : 0;
  const customersWithDebt = dashboard ? dashboard.customers_with_debt : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadDashboard(true)}
            tintColor="#176B67"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logo}>Karny</Text>
          </View>

          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreetingByHour()}</Text>
            <Text style={styles.greetingDate}>
              {formatShortDate(new Date().toISOString())}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatar}>{avatarInitials}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Log out"
            >
              <Text style={styles.logoutText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.subtitle}>YOUR SHOP AT A GLANCE</Text>
          <Text style={styles.welcome}>Welcome, {displayName} 👋</Text>
          <Text style={styles.description}>Here is how things look today.</Text>
        </View>

        {/* Error state with Retry */}
        {errorMessage ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorTitle}>Unable to load notebook</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadDashboard(false)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Retry loading dashboard"
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Main Debt Card */}
        <View style={styles.debtCard}>
          <View style={styles.debtCardTopRow}>
            <Text style={styles.cardLabel}>TODAY&apos;S NOTEBOOK</Text>
            <View style={styles.updatedPill}>
              <Text style={styles.updatedPillText}>Updated today</Text>
            </View>
          </View>

          <Text style={styles.debtLabel}>Total current debt</Text>

          {loading && !dashboard ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <Text style={styles.loadingText}>Loading balance...</Text>
            </View>
          ) : (
            <Text style={styles.debtAmount}>{totalDebtText}</Text>
          )}

          <View style={styles.debtFooterRow}>
            <Text style={styles.customersCount}>
              {totalCustomers}{" "}
              {totalCustomers === 1 ? "customer" : "customers"}
              {customersWithDebt > 0
                ? ` • ${customersWithDebt} with active credit`
                : ""}
            </Text>

            {dashboard ? (
              <Text style={styles.creditPaymentSummary}>
                Paid: {formatCurrency(dashboard.total_payments)}
              </Text>
            ) : null}
          </View>
        </View>

        {/* View Customers Navigation Card */}
        <TouchableOpacity
          style={styles.customersCard}
          onPress={() => router.push("/customers")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="View customers"
        >
          <View style={styles.customersCardIcon}>
            <Text style={styles.customersCardIconText}>♧</Text>
          </View>
          <View style={styles.customersCardBody}>
            <Text style={styles.customersTitle}>View customers</Text>
            <Text style={styles.customersDescription}>
              See who owes what ({totalCustomers}{" "}
              {totalCustomers === 1 ? "person" : "people"})
            </Text>
          </View>
          <Text style={styles.customersCardArrow}>→</Text>
        </TouchableOpacity>

        {/* Quick New Transaction Action */}
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => router.push("/transactions/new")}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Record a new transaction"
        >
          <View style={styles.quickActionIcon}>
            <Text style={styles.quickActionIconText}>+</Text>
          </View>
          <View style={styles.customersCardBody}>
            <Text style={styles.customersTitle}>New transaction</Text>
            <Text style={styles.customersDescription}>
              Record credit or payment in seconds
            </Text>
          </View>
          <Text style={styles.customersCardArrow}>→</Text>
        </TouchableOpacity>

        {/* Reminder Card */}
        <View style={styles.reminder}>
          <Text style={styles.reminderTitle}>Small steps, less worry.</Text>
          <Text style={styles.reminderDescription}>
            Record a payment as soon as it happens.
          </Text>
        </View>

        {/* Recent Activity from Backend */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent notebook entries</Text>
            {dashboard ? (
              <Text style={styles.recentCount}>
                {dashboard.total_transactions} total
              </Text>
            ) : null}
          </View>

          {loading && !dashboard ? (
            <View style={styles.emptyActivityCard}>
              <ActivityIndicator color="#176B67" size="small" />
            </View>
          ) : !dashboard || dashboard.recent_transactions.length === 0 ? (
            <View style={styles.emptyActivityCard}>
              <Text style={styles.emptyActivityTitle}>No transactions yet</Text>
              <Text style={styles.emptyActivitySubtitle}>
                Add a customer or record a transaction to see your paper trail
                here.
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {dashboard.recent_transactions.map((tx) => {
                const isPayment = tx.type === "payment";
                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.recentItem}
                    activeOpacity={0.75}
                    onPress={() =>
                      router.push({
                        pathname: "/customers/[id]",
                        params: { id: String(tx.customer_id) },
                      })
                    }
                  >
                    <View
                      style={[
                        styles.recentBadge,
                        isPayment
                          ? styles.recentBadgePayment
                          : styles.recentBadgeCredit,
                      ]}
                    >
                      <Text
                        style={
                          isPayment
                            ? styles.recentBadgeTextPayment
                            : styles.recentBadgeTextCredit
                        }
                      >
                        {isPayment ? "↓" : "↑"}
                      </Text>
                    </View>

                    <View style={styles.recentInfo}>
                      <Text style={styles.recentCustomerName}>
                        {tx.customer_name || `Customer #${tx.customer_id}`}
                      </Text>
                      <Text style={styles.recentMeta}>
                        {isPayment ? "Payment" : "Credit"} •{" "}
                        {formatShortDate(tx.created_at)}
                        {tx.note ? ` • ${tx.note}` : ""}
                      </Text>
                    </View>

                    <Text
                      style={
                        isPayment
                          ? styles.recentAmountPayment
                          : styles.recentAmountCredit
                      }
                    >
                      {isPayment ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F4",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  logoBadge: {
    backgroundColor: "#176B67",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  logo: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 14,
  },
  greetingContainer: {
    alignItems: "center",
  },
  greeting: {
    color: "#183F3E",
    fontWeight: "800",
    fontSize: 13,
  },
  greetingDate: {
    color: "#82918E",
    fontSize: 10,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9876B",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
  },
  logoutButton: {
    backgroundColor: "#E8F0ED",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: {
    color: "#173F3D",
    fontSize: 11,
    fontWeight: "700",
  },
  welcomeSection: {
    marginBottom: 22,
  },
  subtitle: {
    color: "#D9785E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  welcome: {
    color: "#183F3E",
    fontSize: 26,
    fontWeight: "800",
  },
  description: {
    color: "#82918E",
    fontSize: 13,
    marginTop: 5,
  },
  errorCard: {
    backgroundColor: "#FCECE8",
    borderWidth: 1,
    borderColor: "#F3C1B4",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  errorTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  errorTitle: {
    color: "#8E2B15",
    fontSize: 13,
    fontWeight: "800",
  },
  errorMessage: {
    color: "#B43E24",
    fontSize: 11,
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: "#E8795F",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  debtCard: {
    backgroundColor: "#176B67",
    padding: 20,
    borderRadius: 22,
    marginBottom: 16,
  },
  debtCardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  cardLabel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  updatedPill: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  updatedPillText: {
    color: "#E4F2EF",
    fontSize: 10,
    fontWeight: "700",
  },
  debtLabel: {
    color: "#D8E8E4",
    fontSize: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  loadingText: {
    color: "#D8E8E4",
    fontSize: 13,
  },
  debtAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 4,
  },
  debtFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },
  customersCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  creditPaymentSummary: {
    color: "#D8E8E4",
    fontSize: 11,
    fontWeight: "600",
  },
  customersCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9E6DC",
    flexDirection: "row",
    alignItems: "center",
  },
  quickActionCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E9E6DC",
    flexDirection: "row",
    alignItems: "center",
  },
  customersCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#FAF0D4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  customersCardIconText: {
    color: "#B57C2E",
    fontSize: 18,
    fontWeight: "700",
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "#E4F2EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickActionIconText: {
    color: "#237A75",
    fontSize: 22,
    fontWeight: "600",
  },
  customersCardBody: {
    flex: 1,
  },
  customersTitle: {
    color: "#183F3E",
    fontWeight: "800",
    fontSize: 14,
  },
  customersDescription: {
    color: "#82918E",
    fontSize: 12,
    marginTop: 3,
  },
  customersCardArrow: {
    color: "#82918E",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
  reminder: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E6DC",
    borderStyle: "dashed",
    marginBottom: 22,
  },
  reminderTitle: {
    color: "#183F3E",
    fontWeight: "800",
    fontSize: 13,
  },
  reminderDescription: {
    color: "#82918E",
    fontSize: 11,
    marginTop: 4,
  },
  recentSection: {
    marginTop: 2,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentTitle: {
    color: "#183F3E",
    fontSize: 14,
    fontWeight: "800",
  },
  recentCount: {
    color: "#82918E",
    fontSize: 11,
    fontWeight: "600",
  },
  emptyActivityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E9E6DC",
    padding: 20,
    alignItems: "center",
  },
  emptyActivityTitle: {
    color: "#183F3E",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyActivitySubtitle: {
    color: "#82918E",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  recentList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E9E6DC",
    paddingHorizontal: 14,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2EFE8",
  },
  recentBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  recentBadgePayment: {
    backgroundColor: "#E4F2EF",
  },
  recentBadgeCredit: {
    backgroundColor: "#FCECE8",
  },
  recentBadgeTextPayment: {
    color: "#237A75",
    fontSize: 14,
    fontWeight: "800",
  },
  recentBadgeTextCredit: {
    color: "#E8795F",
    fontSize: 14,
    fontWeight: "800",
  },
  recentInfo: {
    flex: 1,
    marginRight: 8,
  },
  recentCustomerName: {
    color: "#173F3D",
    fontSize: 13,
    fontWeight: "700",
  },
  recentMeta: {
    color: "#82918E",
    fontSize: 11,
    marginTop: 2,
  },
  recentAmountPayment: {
    color: "#237A75",
    fontSize: 13,
    fontWeight: "800",
  },
  recentAmountCredit: {
    color: "#E8795F",
    fontSize: 13,
    fontWeight: "800",
  },
});
