import { getStoredToken } from "./storage";
import type {
  AuthResponse,
  CreateTransactionInput,
  CreateTransactionResponse,
  Customer,
  CustomerInput,
  CustomerTransactionsResponse,
  DashboardSummary,
  DeleteCustomerResponse,
  MeResponse,
  Transaction,
  TransactionType,
} from "../types/karny";

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL;

if (!rawApiUrl) {
  throw new Error("EXPO_PUBLIC_API_URL is not configured.");
}

export const API_URL = rawApiUrl.replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setOnUnauthorizedHandler(
  handler: UnauthorizedHandler | null
): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  requiresAuth?: boolean;
  tokenOverride?: string;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    requiresAuth = true,
    tokenOverride,
  } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (requiresAuth) {
    const token = tokenOverride ?? (await getStoredToken());
    if (!token) {
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
      throw new ApiError("Authentication required. Please log in again.", 401);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Could not connect to the server. Please check your internet or Wi-Fi connection.",
      0
    );
  }

  const rawText = await response.text();
  let parsedData: unknown = null;

  if (rawText) {
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      parsedData = null;
    }
  }

  if (!response.ok) {
    const serverMessage =
      parsedData &&
      typeof parsedData === "object" &&
      ("message" in parsedData || "error" in parsedData)
        ? String(
            (parsedData as { message?: string; error?: string }).message ||
              (parsedData as { message?: string; error?: string }).error ||
              ""
          )
        : "";

    if (response.status === 401 && requiresAuth && unauthorizedHandler) {
      unauthorizedHandler();
    }

    throw new ApiError(
      serverMessage || `Request failed with status ${response.status}.`,
      response.status
    );
  }

  return parsedData as T;
}

// ==========================================
// Authentication API
// ==========================================

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
    requiresAuth: false,
  });
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: { name, email, password },
    requiresAuth: false,
  });
}

export async function getMe(tokenOverride?: string): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me", {
    method: "GET",
    requiresAuth: true,
    tokenOverride,
  });
}

// ==========================================
// Dashboard API
// ==========================================

export async function getDashboard(limit = 5): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(`/dashboard?limit=${limit}`, {
    method: "GET",
  });
}

// ==========================================
// Customers API
// ==========================================

export async function getCustomers(): Promise<Customer[]> {
  return apiRequest<Customer[]>("/customers", {
    method: "GET",
  });
}

export async function getCustomerById(id: number): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: "GET",
  });
}

export async function createCustomer(
  input: CustomerInput
): Promise<Customer> {
  return apiRequest<Customer>("/customers", {
    method: "POST",
    body: input,
  });
}

export async function updateCustomer(
  id: number,
  input: CustomerInput
): Promise<Customer> {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: "PUT",
    body: input,
  });
}

export async function deleteCustomer(
  id: number
): Promise<DeleteCustomerResponse> {
  return apiRequest<DeleteCustomerResponse>(`/customers/${id}`, {
    method: "DELETE",
  });
}

// ==========================================
// Transactions API
// ==========================================

export async function getCustomerTransactions(
  customerId: number
): Promise<CustomerTransactionsResponse> {
  return apiRequest<CustomerTransactionsResponse>(
    `/customers/${customerId}/transactions`,
    {
      method: "GET",
    }
  );
}

export async function createCustomerTransaction(
  customerId: number,
  input: { type: TransactionType; amount: number; note?: string }
): Promise<CreateTransactionResponse> {
  return apiRequest<CreateTransactionResponse>(
    `/customers/${customerId}/transactions`,
    {
      method: "POST",
      body: input,
    }
  );
}

export async function createTransaction(
  input: CreateTransactionInput
): Promise<CreateTransactionResponse> {
  return apiRequest<CreateTransactionResponse>("/transactions", {
    method: "POST",
    body: {
      customer_id: input.customerId,
      type: input.type,
      amount: input.amount,
      note: input.note,
    },
  });
}

export async function getTransactions(params?: {
  customerId?: number;
  type?: TransactionType;
  limit?: number;
}): Promise<Transaction[]> {
  const searchParams = new URLSearchParams();
  if (params?.customerId !== undefined) {
    searchParams.set("customer_id", String(params.customerId));
  }
  if (params?.type !== undefined) {
    searchParams.set("type", params.type);
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  const query = searchParams.toString();
  return apiRequest<Transaction[]>(
    `/transactions${query ? `?${query}` : ""}`,
    {
      method: "GET",
    }
  );
}