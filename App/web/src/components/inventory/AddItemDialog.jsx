import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AddItemDialog({ open, onOpenChange, onSubmit, loading }) {
  const [description, setDescription] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!description.trim()) return;
    onSubmit(description.trim());
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Items to Inventory</DialogTitle>
          <DialogDescription>
            Describe the items you want to add in natural language. For example:
            "2 kg rice, 1 liter milk, 6 eggs"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <textarea
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical"
            placeholder="e.g. 2 kg rice, 500 ml olive oil, 3 cans of tuna, 1 dozen eggs"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !description.trim()}>
              {loading ? "Adding..." : "Add Items"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
