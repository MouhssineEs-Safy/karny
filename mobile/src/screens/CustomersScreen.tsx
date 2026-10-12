import React, { useCallback, useMemo, useState } from "react";
import { router, useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import BottomNav from "../components/BottomNav";
import CustomerFormModal from "../components/CustomerFormModal";
import {
  createCustomer,
  getCustomers,
  updateCustomer,
} from "../services/api";
import type { Customer, CustomerInput } from "../types/karny";
import { formatCurrency, getInitials } from "../utils/formatters";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const loadCustomers = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await getCustomers();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load customers."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadCustomers(false);
    }, [loadCustomers])
  );

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query)
    );
  }, [customers, searchQuery]);

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setModalVisible(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setModalVisible(true);
  };

  const handleSaveCustomer = async (input: CustomerInput) => {
    if (editingCustomer) {
      const updated = await updateCustomer(editingCustomer.id, input);
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
      );
    } else {
      const created = await createCustomer(input);
      setCustomers((prev) => [...prev, created]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadCustomers(true)}
            tintColor="#237A75"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.logoBox}
            onPress={() => router.replace("/home")}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
          >
            <Text style={styles.logoIcon}>▣</Text>
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.title}>Customers</Text>
            <Text style={styles.titleSubtitle}>
              {customers.length}{" "}
              {customers.length === 1 ? "person" : "people"} in your notebook
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={handleOpenAddModal}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Add new customer"
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Introduction */}
        <View style={styles.introduction}>
          <Text style={styles.eyebrow}>YOUR NEIGHBORHOOD, TOGETHER</Text>
          <Text style={styles.heading}>Who needs a little</Text>
          <Text style={styles.headingAccent}>reminder?</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search a customer by name or phone"
            placeholderTextColor="#A5B2B0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            accessibilityLabel="Search a customer"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearSearchBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Error state with Retry */}
        {errorMessage ? (
          <View style={styles.errorCard} accessibilityRole="alert">
            <View style={styles.errorTextWrapper}>
              <Text style={styles.errorTitle}>Could not load customers</Text>
              <Text style={styles.errorSubtitle}>{errorMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => void loadCustomers(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Customers title */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {searchQuery.trim() ? "Matching customers" : "All customers"}
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredCustomers.length}</Text>
          </View>
        </View>

        {/* Customers list */}
        {loading && customers.length === 0 ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color="#237A75" />
            <Text style={styles.stateText}>Loading your notebook...</Text>
          </View>
        ) : filteredCustomers.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim()
                ? "No customers match your search"
                : "Your notebook is empty"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? "Try searching with a different name or phone number."
                : "Tap the + button above to add your first customer."}
            </Text>
            {!searchQuery.trim() ? (
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={handleOpenAddModal}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyAddButtonText}>+ Add customer</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View style={styles.customerList}>
            {filteredCustomers.map((customer) => {
              const debtNum = Number(customer.amount);
              return (
                <TouchableOpacity
                  key={customer.id}
                  style={styles.customerCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/customers/[id]",
                      params: { id: String(customer.id) },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`View details for ${customer.name}`}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {getInitials(customer.name)}
                    </Text>
                  </View>

                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {customer.name}
                    </Text>
                    <Text style={styles.customerPhone}>{customer.phone}</Text>
                  </View>

                  <View style={styles.amountSection}>
                    <Text
                      style={[
                        styles.amount,
                        debtNum === 0 && styles.amountSettled,
                      ]}
                    >
                      {formatCurrency(customer.amount)}
                    </Text>
                    <Text style={styles.amountLabel}>
                      {debtNum > 0 ? "current debt" : "settled"}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(customer);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${customer.name}`}
                  >
                    <Text style={styles.editButtonText}>✎</Text>
                  </TouchableOpacity>

                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomNav activeTab="customers" />

      <CustomerFormModal
        visible={modalVisible}
        initialCustomer={editingCustomer}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSaveCustomer}
      />
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
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoBox: {
    width: 40,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#237A75",
    alignItems: "center",
    justifyContent: "center",
  },

  logoIcon: {
    color: "#FFFFFF",
    fontSize: 18,
  },

  headerTitle: {
    alignItems: "center",
  },

  title: {
    fontSize: 15,
    fontWeight: "800",
    color: "#173F3D",
  },

  titleSubtitle: {
    fontSize: 11,
    color: "#7B8582",
    marginTop: 2,
  },

  addButton: {
    width: 40,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#237A75",
    alignItems: "center",
    justifyContent: "center",
  },

  addText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "400",
    lineHeight: 24,
  },

  introduction: {
    marginTop: 32,
    marginBottom: 22,
  },

  eyebrow: {
    color: "#D9785E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 5,
  },

  heading: {
    color: "#173F3D",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
  },

  headingAccent: {
    color: "#E8795F",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
  },

  searchBox: {
    height: 46,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E5DF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  searchIcon: {
    color: "#8C9A96",
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#173F3D",
  },

  clearSearchBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  clearSearchText: {
    color: "#8C9A96",
    fontSize: 12,
    fontWeight: "700",
  },

  errorCard: {
    backgroundColor: "#FCECE8",
    borderWidth: 1,
    borderColor: "#F3C1B4",
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  errorTextWrapper: {
    flex: 1,
    marginRight: 10,
  },

  errorTitle: {
    color: "#8E2B15",
    fontSize: 13,
    fontWeight: "800",
  },

  errorSubtitle: {
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

  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 10,
  },

  listTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#53635F",
  },

  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E4F0EC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },

  countText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#237A75",
  },

  stateBox: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 18,
    padding: 28,
    alignItems: "center",
    marginTop: 6,
  },

  stateText: {
    color: "#7B8582",
    fontSize: 13,
    marginTop: 10,
  },

  emptyTitle: {
    color: "#173F3D",
    fontSize: 15,
    fontWeight: "800",
  },

  emptySubtitle: {
    color: "#8C9A96",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },

  emptyAddButton: {
    marginTop: 16,
    backgroundColor: "#237A75",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
  },

  emptyAddButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  customerList: {
    gap: 10,
  },

  customerCard: {
    minHeight: 68,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E6E8E2",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#E4F2EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#237A75",
  },

  customerInfo: {
    flex: 1,
    marginRight: 8,
  },

  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#173F3D",
  },

  customerPhone: {
    fontSize: 11,
    color: "#94A09D",
    marginTop: 3,
  },

  amountSection: {
    alignItems: "flex-end",
    marginRight: 10,
  },

  amount: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E8795F",
  },

  amountSettled: {
    color: "#237A75",
  },

  amountLabel: {
    fontSize: 10,
    color: "#A5B0AD",
    marginTop: 2,
  },

  editButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#F2F5F3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },

  editButtonText: {
    fontSize: 13,
    color: "#237A75",
    fontWeight: "700",
  },

  arrow: {
    fontSize: 20,
    color: "#AAB5B1",
  },
});
