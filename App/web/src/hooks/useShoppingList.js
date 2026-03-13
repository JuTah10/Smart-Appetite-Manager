import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { inventoryRestApi } from "@/api/inventoryRest";

/**
 * Manages shopping list items: fetching, adding, toggling, deleting.
 */
export function useShoppingList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchingRef = useRef(false);

  const fetchItems = useCallback(async ({ background = false } = {}) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (!background) setLoading(true);
    setError(null);

    try {
      const result = await inventoryRestApi.shoppingList();
      const rows = result?.rows ?? [];
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      fetchingRef.current = false;
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
    const id = window.setInterval(() => void fetchItems({ background: true }), 5000);
    return () => window.clearInterval(id);
  }, [fetchItems]);

  const addItems = useCallback(
    async (newItems) => {
      try {
        await inventoryRestApi.addShoppingListItems(newItems);
        toast.success("Added to shopping list");
        await fetchItems({ background: true });
        return true;
      } catch (err) {
        toast.error("Failed to add items", {
          description: err instanceof Error ? err.message : String(err),
        });
        return false;
      }
    },
    [fetchItems]
  );

  const toggleItem = useCallback(
    async (itemId) => {
      // Optimistic update
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId ? { ...it, checked: it.checked ? 0 : 1 } : it
        )
      );
      try {
        await inventoryRestApi.toggleShoppingListItem(itemId);
      } catch (err) {
        toast.error("Failed to toggle item");
        await fetchItems({ background: true });
      }
    },
    [fetchItems]
  );

  const deleteItem = useCallback(
    async (itemId) => {
      setItems((prev) => prev.filter((it) => it.id !== itemId));
      try {
        await inventoryRestApi.deleteShoppingListItem(itemId);
      } catch (err) {
        toast.error("Failed to delete item");
        await fetchItems({ background: true });
      }
    },
    [fetchItems]
  );

  const clearChecked = useCallback(async () => {
    try {
      const result = await inventoryRestApi.clearCheckedShoppingListItems();
      const count = result?.deleted ?? 0;
      if (count > 0) toast.success(`Cleared ${count} checked item${count !== 1 ? "s" : ""}`);
      await fetchItems({ background: true });
    } catch (err) {
      toast.error("Failed to clear checked items");
    }
  }, [fetchItems]);

  const checkedCount = items.filter((it) => it.checked).length;
  const uncheckedCount = items.length - checkedCount;

  return {
    items,
    loading,
    error,
    fetchItems,
    addItems,
    toggleItem,
    deleteItem,
    clearChecked,
    checkedCount,
    uncheckedCount,
  };
}
