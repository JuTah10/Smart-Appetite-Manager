import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryStyle } from "@/lib/categoryConfig";

function formatUpdatedAt(value) {
  if (!value) return "—";
  const parsed = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString();
}

function SortableHeader({ field, label, sortField, sortDirection, onToggleSort, className = "" }) {
  const isActive = sortField === field;
  return (
    <button
      type="button"
      className={`font-medium text-left hover:underline cursor-pointer inline-flex items-center gap-1 ${className}`}
      onClick={() => onToggleSort(field)}
      title={`Sort by ${label}`}
    >
      {label}
      {isActive ? (sortDirection === "desc" ? " ↓" : " ↑") : ""}
    </button>
  );
}

export function InventoryTable({
  items,
  loading,
  onEdit,
  onDelete,
  sortField = "updated_at",
  sortDirection = "desc",
  onToggleSort,
  newItemKeys = new Set(),
  itemKey,
}) {
  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-4xl mb-3">📦</div>
        <h3 className="text-lg font-semibold text-foreground">
          No items in inventory
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first items to get started
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">
              <SortableHeader field="product_name" label="Product" sortField={sortField} sortDirection={sortDirection} onToggleSort={onToggleSort} />
            </TableHead>
            <TableHead>
              <SortableHeader field="category" label="Category" sortField={sortField} sortDirection={sortDirection} onToggleSort={onToggleSort} />
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader field="quantity" label="Quantity" sortField={sortField} sortDirection={sortDirection} onToggleSort={onToggleSort} className="justify-end" />
            </TableHead>
            <TableHead>
              <SortableHeader field="quantity_unit" label="Unit" sortField={sortField} sortDirection={sortDirection} onToggleSort={onToggleSort} />
            </TableHead>
            <TableHead>
              <SortableHeader field="unit" label="Package" sortField={sortField} sortDirection={sortDirection} onToggleSort={onToggleSort} />
            </TableHead>
            <TableHead>
              <SortableHeader field="updated_at" label="Last Updated" sortField={sortField} sortDirection={sortDirection} onToggleSort={onToggleSort} />
            </TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const key = item.id || `${item.product_name}-${index}`;
            const isNew = itemKey && newItemKeys.size > 0 && newItemKeys.has(itemKey(item));
            return (
              <TableRow
                key={key}
                className={isNew ? "animate-highlight-fade bg-emerald-50" : ""}
              >
                <TableCell className="font-medium">
                  {item.product_name}
                  {isNew && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      New
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getCategoryStyle(item.category)}`}>
                    {item.category || "Other"}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <Badge
                    variant={
                      Number(item.quantity) <= 0 ? "destructive" : "secondary"
                    }
                  >
                    {item.quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.quantity_unit || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.unit || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatUpdatedAt(item.updated_at || item.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      title="Edit stock"
                    >
                      ✏️
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(item)}
                      title="Delete item"
                      className="text-destructive hover:text-destructive"
                    >
                      🗑️
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
