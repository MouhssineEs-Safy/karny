const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function getInitials(name: string): string {
  const cleaned = (name || "").trim();
  if (!cleaned) return "K";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function getFirstName(name?: string | null): string {
  const cleaned = (name || "").trim();
  if (!cleaned) return "Merchant";
  return cleaned.split(/\s+/)[0];
}

export function formatAmountNumber(amount: string | number): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return "0";
  const rounded = Math.round(num * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2);
}

export function formatCurrency(amount: string | number): string {
  return `${formatAmountNumber(amount)} DH`;
}

export function formatShortDate(isoDate?: string | null): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatActivityDate(isoDate?: string | null): string {
  if (!isoDate) return "No recent activity";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Updated today";
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  return `Last activity ${day} ${month}`;
}

export function formatSlashDate(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getGreetingByHour(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function parseCurrencyInput(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (!normalized) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 99999999.99) {
    return null;
  }
  return Math.round(value * 100) / 100;
}
