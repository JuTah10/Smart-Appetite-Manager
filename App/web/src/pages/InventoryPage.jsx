import React, { useCallback, useEffect, useState } from "react";
import { useGateway, useAgentQuery } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddItemDialog } from "@/components/inventory/AddItemDialog";
import { EditItemDialog } from "@/components/inventory/EditItemDialog";
import { DeleteItemDialog } from "@/components/inventory/DeleteItemDialog";

function extractItems(result) {
  if (!result) return [];
  const { data, type } = result;
  if (type === "json") {
    if (Array.isArray(data)) return data;
    if (data?.rows && Array.isArray(data.rows)) return data.rows;
    if (data?.data && Array.isArray(data.data)) return data.data;
  }
  if (type === "table" && Array.isArray(data)) return data;
  return [];
}

export default function InventoryPage() {
  const { api } = useGateway();
  const { data, type, loading, error, execute } = useAgentQuery();
  const [items, setItems] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [mutating, setMutating] = useState(false);

  const fetchItems = useCallback(() => {
    execute(() => api.inventory.list());
  }, [api, execute]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setItems(extractItems({ data, type }));
  }, [data, type]);

  const handleAdd = async (description) => {
    setMutating(true);
    try {
      await api.inventory.addItems(description);
      toast.success("Items added successfully");
      setAddOpen(false);
      fetchItems();
    } catch (err) {
      toast.error("Failed to add items", { description: err.message });
    } finally {
      setMutating(false);
    }
  };

  const handleIncrease = async (productName, amount, unit) => {
    setMutating(true);
    try {
      await api.inventory.increaseStock(productName, amount, unit);
      toast.success(`Increased ${productName} stock`);
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast.error("Failed to increase stock", { description: err.message });
    } finally {
      setMutating(false);
    }
  };

  const handleDecrease = async (productName, amount, unit) => {
    setMutating(true);
    try {
      await api.inventory.decreaseStock(productName, amount, unit);
      toast.success(`Decreased ${productName} stock`);
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast.error("Failed to decrease stock", { description: err.message });
    } finally {
      setMutating(false);
    }
  };

  const handleDelete = async (productName) => {
    setMutating(true);
    try {
      await api.inventory.deleteItem(productName);
      toast.success(`Deleted ${productName}`);
      setDeleteItem(null);
      fetchItems();
    } catch (err) {
      toast.error("Failed to delete item", { description: err.message });
    } finally {
      setMutating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-2xl font-bold">Inventory</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your kitchen inventory items
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchItems} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={() => setAddOpen(true)}>Add Items</Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
              <p className="text-sm text-destructive">
                Failed to load inventory: {error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={fetchItems}
              >
                Retry
              </Button>
            </div>
          )}
          <InventoryTable
            items={items}
            loading={loading}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
          />
        </CardContent>
      </Card>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
        loading={mutating}
      />

      <EditItemDialog
        item={editItem}
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        loading={mutating}
      />

      <DeleteItemDialog
        item={deleteItem}
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={mutating}
      />
    </div>
  );
}
