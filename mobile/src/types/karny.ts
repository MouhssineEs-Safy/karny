export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  amount: string;
  user_id: number;
  total_credit?: string;
  total_payments?: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  amount?: number;
}

export interface DeleteCustomerResponse {
  message: string;
  customer: Customer;
}

export type TransactionType = "credit" | "payment";

export interface Transaction {
  id: number;
  customer_id: number;
  user_id: number;
  type: TransactionType;
  amount: string;
  note: string | null;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface CustomerTransactionsSummary {
  total_credit: string;
  total_payments: string;
  outstanding_balance: string;
  transaction_count: number;
}

export interface CustomerTransactionsResponse {
  customer: Customer;
  summary: CustomerTransactionsSummary;
  transactions: Transaction[];
}

export interface CreateTransactionInput {
  customerId: number;
  type: TransactionType;
  amount: number;
  note?: string;
}

export interface CreateTransactionResponse {
  message: string;
  transaction: Transaction;
  customer: Customer;
}

export interface DashboardSummary {
  total_customers: number;
  customers_with_debt: number;
  total_outstanding_debt: string;
  total_transactions: number;
  total_credit: string;
  total_payments: string;
  recent_transactions: Transaction[];
}
