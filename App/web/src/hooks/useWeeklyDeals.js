import { useCallback, useEffect, useRef, useState } from "react";
import { inventoryRestApi } from "@/api/inventoryRest";
import { normalizeInventoryRows, inventoryFingerprint } from "@/lib/mealdb";
import { extractItems } from "@/lib/parseResponse";
import { readDealsCache, writeDealsCache } from "@/lib/dealsCache";

export function useWeeklyDeals() {
  const [deals, setDeals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [freshness, setFreshness] = useState("no_cache");
  const fetchingRef = useRef(false);

  const fetchCurrentInventory = useCallback(async () => {
    const result = await inventoryRestApi.list();
    return normalizeInventoryRows(extractItems(result));
  }, []);

  const refreshFreshness = useCallback(async () => {
    setChecking(true);

    const cached = readDealsCache();
    if (cached?.deals) {
      setDeals(cached.deals);
    }

    try {
      const rows = await fetchCurrentInventory();
      const fingerprint = inventoryFingerprint(rows);

      if (!cached?.deals) {
        setFreshness("no_cache");
      } else if (cached.inventoryFingerprint === fingerprint) {
        setFreshness("fresh");
      } else {
        setFreshness("stale");
      }
    } catch {
      if (cached?.deals) {
        setFreshness("unknown");
      }
    } finally {
      setChecking(false);
    }
  }, [fetchCurrentInventory]);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const [result, rows] = await Promise.all([
        inventoryRestApi.deals(),
        fetchCurrentInventory(),
      ]);
      const fingerprint = inventoryFingerprint(rows);

      setDeals(result);
      setFreshness("fresh");
      writeDealsCache({
        deals: result,
        inventoryFingerprint: fingerprint,
        fetchedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [fetchCurrentInventory]);

  // On mount: load cache + check freshness, auto-fetch if no cache
  useEffect(() => {
    (async () => {
      setChecking(true);
      const cached = readDealsCache();
      if (cached?.deals) {
        setDeals(cached.deals);
      }

      try {
        const rows = await fetchCurrentInventory();
        const fingerprint = inventoryFingerprint(rows);

        if (!cached?.deals) {
          setChecking(false);
          void refresh();
          return;
        } else if (cached.inventoryFingerprint === fingerprint) {
          setFreshness("fresh");
        } else {
          setFreshness("stale");
        }
      } catch {
        if (cached?.deals) {
          setFreshness("unknown");
        } else {
          setChecking(false);
          void refresh();
          return;
        }
      }
      setChecking(false);
    })();
  }, [fetchCurrentInventory, refresh]);

  // Re-check freshness on window focus
  useEffect(() => {
    const onFocus = () => void refreshFreshness();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshFreshness]);

  return { deals, loading, error, refresh, freshness, checking };
}
