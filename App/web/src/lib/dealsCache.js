const DEALS_CACHE_KEY = "weekly_deals_cache_v1";

export function readDealsCache() {
  try {
    const raw = localStorage.getItem(DEALS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      parsed.version !== 1 ||
      !parsed.deals ||
      typeof parsed.inventoryFingerprint !== "string" ||
      typeof parsed.fetchedAt !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeDealsCache({ deals, inventoryFingerprint, fetchedAt }) {
  const record = {
    version: 1,
    deals,
    inventoryFingerprint,
    fetchedAt,
  };
  localStorage.setItem(DEALS_CACHE_KEY, JSON.stringify(record));
}

export function clearDealsCache() {
  localStorage.removeItem(DEALS_CACHE_KEY);
}
