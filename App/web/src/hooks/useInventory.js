import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { inventoryRestApi } from "@/api/inventoryRest";
import { extractItems } from "@/lib/parseResponse";

/**
 * Manages inventory items: fetching, polling, CRUD operations, and sorting.
 *
 * @param {ReturnType<import("@/api/agents").createAgentAPI>} api - Agent API instance
 * @param {() => void} persistSession - Callback to persist gateway session
 */
export function useInventory(api, persistSession) {
  const [items, setItems] = useState([]);
  const [sortDirection, setSortDirection] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const fetchingRef = useRef(false);

  const fetchItems = useCallback(async ({ background = false } = {}) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!background) {
      setLoading(true);
    }
    setError(null);

    try {
      const result = await inventoryRestApi.list();
      setItems(extractItems(result));
      setLastSyncedAt(new Date());
    } catch (err) {
      const normalized = err instanceof Error ? err : new Error(String(err));
      setError(normalized);
    } finally {
      fetchingRef.current = false;
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  // Initial fetch + polling + focus refetch
  useEffect(() => {
    void fetchItems();
    const intervalId = window.setInterval(() => {
      void fetchItems({ background: true });
    }, 5000);
    const onFocus = () => {
      void fetchItems({ background: true });
    };
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchItems]);

  const handleAdd = useCallback(
    async (description) => {
      setMutating(true);
      try {
        await api.inventory.addItems(description);
        persistSession();
        toast.success("Items added successfully");
        await fetchItems({ background: true });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error("Failed to add items", { description: message });
        return false;
      } finally {
        setMutating(false);
      }
    },
    [api, persistSession, fetchItems]
  );

  const handleIncrease = useCallback(
    async (item, amount) => {
      setMutating(true);
      try {
        const unit = item.quantity_unit || item.unit || "unit";
        await api.inventory.increaseStock(item.product_name, amount, unit);
        persistSession();
        toast.success(`Increased ${item.product_name} stock`);
        await fetchItems({ background: true });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error("Failed to increase stock", { description: message });
        return false;
      } finally {
        setMutating(false);
      }
    },
    [api, persistSession, fetchItems]
  );

  const handleDecrease = useCallback(
    async (item, amount) => {
      setMutating(true);
      try {
        const unit = item.quantity_unit || item.unit || "unit";
        await api.inventory.decreaseStock(item.product_name, amount, unit);
        persistSession();
        toast.success(`Decreased ${item.product_name} stock`);
        await fetchItems({ background: true });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error("Failed to decrease stock", { description: message });
        return false;
      } finally {
        setMutating(false);
      }
    },
    [api, persistSession, fetchItems]
  );

  const handleDelete = useCallback(
    async (item) => {
      setMutating(true);
      try {
        await api.inventory.deleteItem(item.product_name);
        persistSession();
        toast.success(`Deleted ${item.product_name}`);
        await fetchItems({ background: true });
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error("Failed to delete item", { description: message });
        return false;
      } finally {
        setMutating(false);
      }
    },
    [api, persistSession, fetchItems]
  );

  const sortedItems = useMemo(() => {
    const next = [...items];
    next.sort((a, b) => {
      const aTs = String(a?.updated_at || a?.created_at || "");
      const bTs = String(b?.updated_at || b?.created_at || "");
      if (aTs === bTs) return 0;
      if (sortDirection === "desc") {
        return aTs < bTs ? 1 : -1;
      }
      return aTs > bTs ? 1 : -1;
    });
    return next;
  }, [items, sortDirection]);

  const toggleSort = useCallback(() => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
  }, []);

  return {
    items: sortedItems,
    loading,
    error,
    mutating,
    lastSyncedAt,
    sortDirection,
    toggleSort,
    fetchItems,
    handleAdd,
    handleIncrease,
    handleDecrease,
    handleDelete,
  };
}
