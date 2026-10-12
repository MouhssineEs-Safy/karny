import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { User } from "../types/karny";

const TOKEN_KEY = "karny_token";
const USER_KEY = "karny_user";

const memoryFallback: Record<string, string> = {};

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback to in-memory storage if localStorage is blocked
    }
    memoryFallback[key] = value;
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory storage
    }
    return memoryFallback[key] ?? null;
  }

  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore web storage errors
    }
    delete memoryFallback[key];
    return;
  }

  await SecureStore.deleteItemAsync(key);
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getStoredUser(): Promise<User | null> {
  try {
    const raw = await getItem(USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (
      parsed &&
      typeof parsed.id === "number" &&
      typeof parsed.name === "string" &&
      typeof parsed.email === "string"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuthStorage(): Promise<void> {
  await Promise.allSettled([deleteItem(TOKEN_KEY), deleteItem(USER_KEY)]);
}
