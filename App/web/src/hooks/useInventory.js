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
  const [deleteProgress, setDeleteProgress] = useState(null);
  const [newItemKeys, setNewItemKeys] = useState(new Set());
  const fetchingRef = useRef(false);
  const newItemTimerRef = useRef(null);

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
      if (newItemTimerRef.current) clearTimeout(newItemTimerRef.current);
    };
  }, [fetchItems]);

  const itemKey = useCallback(
    (item) => `${item.product_name}::${item.quantity_unit || ""}::${item.unit || ""}`,
    []
  );

  const highlightNewItems = useCallback(
    (previousItems, currentItems) => {
      const prevKeys = new Set(previousItems.map(itemKey));
      const added = new Set();
      for (const item of currentItems) {
        const key = itemKey(item);
        if (!prevKeys.has(key)) added.add(key);
      }
      if (added.size > 0) {
        setNewItemKeys(added);
        if (newItemTimerRef.current) clearTimeout(newItemTimerRef.current);
        newItemTimerRef.current = setTimeout(() => setNewItemKeys(new Set()), 4000);
      }
    },
    [itemKey]
  );

  const handleAdd = useCallback(
    async (description) => {
      setMutating(true);
      const snapshotBefore = [...items];
      try {
        await api.inventory.addItems(description);
        persistSession();
        toast.success("Items added successfully");
        const result = await inventoryRestApi.list();
        const updated = extractItems(result);
        setItems(updated);
        setLastSyncedAt(new Date());
        highlightNewItems(snapshotBefore, updated);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error("Failed to add items", { description: message });
        return false;
      } finally {
        setMutating(false);
      }
    },
    [api, persistSession, items, highlightNewItems]
  );

  const handleIncrease = useCallback(
    async (item, amount) => {
      setMutating(true);
      try {
        const quantityUnit = item.quantity_unit || item.unit || "unit";
        const unit = item.unit || item.quantity_unit || "unit";
        await api.inventory.increaseStock(item.product_name, amount, quantityUnit, unit);
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
        const quantityUnit = item.quantity_unit || item.unit || "unit";
        const unit = item.unit || item.quantity_unit || "unit";
        await api.inventory.decreaseStock(item.product_name, amount, quantityUnit, unit);
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
      setDeleteProgress({ phase: "deleting", message: "Sending delete request to backend..." });
      try {
        const response = await api.inventory.deleteItem(item.product_name, item.quantity_unit, item.unit);
        persistSession();
        setDeleteProgress({
          phase: "syncing",
          message: "Item deleted. Refreshing inventory...",
          backendResponse: response.text,
        });
        await fetchItems({ background: true });
        setDeleteProgress({
          phase: "done",
          message: `${item.product_name} has been removed from your inventory.`,
          backendResponse: response.text,
        });
        toast.success(`Deleted ${item.product_name}`);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setDeleteProgress({ phase: "error", message });
        toast.error("Failed to delete item", { description: message });
        return false;
      } finally {
        setMutating(false);
      }
    },
    [api, persistSession, fetchItems]
  );

  const clearDeleteProgress = useCallback(() => {
    setDeleteProgress(null);
  }, []);

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
    deleteProgress,
    clearDeleteProgress,
    newItemKeys,
    itemKey,
  };
}
