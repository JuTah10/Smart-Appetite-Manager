import React, { useState } from "react";
import { useGateway } from "@/api";
import { AGENTS } from "@/api/agents";
import { useGatewaySession } from "@/hooks/useGatewaySession";
import { useInventory } from "@/hooks/useInventory";
import { useAssistantChat } from "@/hooks/useAssistantChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { AddItemDialog } from "@/components/inventory/AddItemDialog";
import { EditItemDialog } from "@/components/inventory/EditItemDialog";
import { DeleteItemDialog } from "@/components/inventory/DeleteItemDialog";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";

const STORAGE_KEYS = {
  gatewayUrl: "inventory_gateway_url",
  sessionId: "inventory_gateway_session_id",
  agentName: "inventory_gateway_agent_name",
};

export default function InventoryPage() {
  const { client, api } = useGateway();
  const { persistSession } = useGatewaySession(
    client,
    STORAGE_KEYS,
    AGENTS.INVENTORY
  );

  const inventory = useInventory(api, persistSession);
  const chat = useAssistantChat(client, AGENTS.INVENTORY, {
    welcomeText:
      "Inventory chat ready. Ask me to add, update, delete, or explain your inventory.",
    idPrefix: "inventory-chat",
    errorLabel: "Inventory chat failed",
    onComplete: () => inventory.fetchItems({ background: true }),
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const handleAdd = async (description) => {
    const success = await inventory.handleAdd(description);
    if (success) setAddOpen(false);
  };

  const handleIncrease = async (item, amount) => {
    const success = await inventory.handleIncrease(item, amount);
    if (success) setEditItem(null);
  };

  const handleDecrease = async (item, amount) => {
    const success = await inventory.handleDecrease(item, amount);
    if (success) setEditItem(null);
  };

  const handleDelete = async (item) => {
    const success = await inventory.handleDelete(item);
    if (success) setDeleteItem(null);
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
            <p className="text-xs text-muted-foreground mt-1">
              {inventory.lastSyncedAt
                ? `Live backend sync: ${inventory.lastSyncedAt.toLocaleTimeString()}`
                : "Live backend sync: pending"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => void inventory.fetchItems()}
              disabled={inventory.loading}
            >
              {inventory.loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setChatOpen(true)}
              className="gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M12 6c-1.7 0-3 1.1-3 2.5S10.3 11 12 11s3-1.1 3-2.5S13.7 6 12 6z" />
                <path d="M17 3.3C15.5 2.5 13.8 2 12 2s-3.5.5-5 1.3" />
                <path d="M2 16.5c0-2 2-3.5 4.5-4.3" />
                <path d="M17.5 12.2c2.5.8 4.5 2.3 4.5 4.3" />
                <path d="M4.5 21a9.9 9.9 0 0 1 15 0" />
              </svg>
              Ask Assistant
            </Button>
            <Button onClick={() => setAddOpen(true)}>Add Items</Button>
          </div>
        </CardHeader>
        <CardContent>
          {inventory.error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4">
              <p className="text-sm text-destructive">
                Failed to load inventory: {inventory.error.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void inventory.fetchItems()}
              >
                Retry
              </Button>
            </div>
          )}
          <InventoryTable
            items={inventory.items}
            loading={inventory.loading}
            onEdit={setEditItem}
            onDelete={setDeleteItem}
            sortDirection={inventory.sortDirection}
            onToggleSort={inventory.toggleSort}
          />
        </CardContent>
      </Card>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={handleAdd}
        loading={inventory.mutating}
      />

      <EditItemDialog
        item={editItem}
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        loading={inventory.mutating}
      />

      <DeleteItemDialog
        item={deleteItem}
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={inventory.mutating}
      />

      <AssistantPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Kitchen Assistant"
        subtitle="I can help manage your inventory. Just ask!"
        messages={chat.messages}
        activeTimeline={chat.activeTimeline}
        input={chat.input}
        onInputChange={chat.setInput}
        onSend={() => void chat.send()}
        sending={chat.sending}
      />
    </div>
  );
}
