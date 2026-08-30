export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  KES: "KSh ",
  GHS: "GH₵",
};

export function formatMoney(amount: number | string, currency = "NGN") {
  const value = Number(amount ?? 0);
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const BILLING_INTERVALS = [
  { value: "daily", label: "Daily", suffix: "/day" },
  { value: "weekly", label: "Weekly", suffix: "/week" },
  { value: "monthly", label: "Monthly", suffix: "/month" },
  { value: "yearly", label: "Yearly", suffix: "/year" },
  { value: "one_time", label: "One-time", suffix: "" },
] as const;

export function intervalSuffix(interval: string) {
  return BILLING_INTERVALS.find((i) => i.value === interval)?.suffix ?? "";
}

export function intervalLabel(interval: string) {
  return BILLING_INTERVALS.find((i) => i.value === interval)?.label ?? interval;
}

/** Number of days a plan grants when access_days is not explicitly set. */
export function defaultAccessDays(interval: string, count = 1) {
  const base: Record<string, number> = {
    daily: 1,
    weekly: 7,
    monthly: 30,
    yearly: 365,
    one_time: 3650,
  };
  return (base[interval] ?? 30) * Math.max(count, 1);
}

/** All timestamps are stored in UTC. Rendering always goes through the user's timezone. */
export function formatDateTime(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(iso));
}

export function formatDate(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone }).format(new Date(iso));
}

export function formatTime(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, { timeStyle: "short", timeZone }).format(new Date(iso));
}

export function formatDayTime(iso: string | null | undefined, timeZone: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
}

export function formatDuration(minutes?: number | null) {
  if (!minutes && minutes !== 0) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function formatSeconds(seconds?: number | null) {
  if (!seconds && seconds !== 0) return "—";
  return formatDuration(Math.round(seconds / 60));
}

export function countdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const minutes = mins % 60;
  if (days) return `in ${days}d ${hours}h`;
  if (hours) return `in ${hours}h ${minutes}m`;
  return `in ${minutes}m`;
}

/** Converts a datetime-local value (interpreted in the given IANA zone) into a UTC ISO string. */
export function localInputToUtcIso(value: string, timeZone: string) {
  // Interpret the wall-clock value in `timeZone` by measuring that zone's offset.
  const naive = new Date(value);
  const asUtc = new Date(naive.toLocaleString("en-US", { timeZone: "UTC" }));
  const asZoned = new Date(naive.toLocaleString("en-US", { timeZone }));
  const offset = asUtc.getTime() - asZoned.getTime();
  return new Date(naive.getTime() + offset).toISOString();
}

/** Inverse of localInputToUtcIso — produces a value for <input type="datetime-local">. */
export function utcIsoToLocalInput(iso: string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export const COMMON_TIMEZONES = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Johannesburg",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Asia/Dubai",
  "UTC",
];

export function initials(first?: string | null, last?: string | null, fallback = "EV") {
  const value = `${first?.[0] ?? ""}${last?.[0] ?? ""}`.trim();
  return value ? value.toUpperCase() : fallback;
}
