import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2Icon,
  CheckCircle2Icon,
  RefreshCwIcon,
  AlertCircleIcon,
} from "lucide-react";

const PHASE_CONFIG = {
  deleting: {
    icon: Loader2Icon,
    iconClass: "w-4 h-4 text-amber-500 animate-spin",
    bgClass: "border-amber-200 bg-amber-50",
    textClass: "text-amber-800",
  },
  syncing: {
    icon: RefreshCwIcon,
    iconClass: "w-4 h-4 text-blue-500 animate-spin",
    bgClass: "border-blue-200 bg-blue-50",
    textClass: "text-blue-800",
  },
  done: {
    icon: CheckCircle2Icon,
    iconClass: "w-4 h-4 text-emerald-500",
    bgClass: "border-emerald-200 bg-emerald-50",
    textClass: "text-emerald-800",
  },
  error: {
    icon: AlertCircleIcon,
    iconClass: "w-4 h-4 text-destructive",
    bgClass: "border-destructive/30 bg-destructive/10",
    textClass: "text-destructive",
  },
};

export function DeleteItemDialog({ item, open, onOpenChange, onConfirm, loading, deleteProgress }) {
  if (!item) return null;

  const isDone = deleteProgress?.phase === "done";
  const hasProgress = deleteProgress !== null;
  const config = hasProgress ? PHASE_CONFIG[deleteProgress.phase] : null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDone ? "Item deleted" : "Delete item?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDone ? (
              <>
                <span className="font-semibold text-foreground">
                  {item.product_name}
                </span>{" "}
                has been removed from your inventory.
              </>
            ) : (
              <>
                This will permanently remove{" "}
                <span className="font-semibold text-foreground">
                  {item.product_name}
                </span>{" "}
                from your inventory. This action cannot be undone.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {hasProgress && config && (
          <div className={`rounded-lg border p-3 text-sm flex items-start gap-2 ${config.bgClass}`}>
            <config.icon className={`${config.iconClass} mt-0.5 shrink-0`} />
            <div className={`min-w-0 ${config.textClass}`}>
              <p>{deleteProgress.message}</p>
              {deleteProgress.backendResponse && (
                <details className="mt-1.5">
                  <summary className="text-xs cursor-pointer opacity-70 hover:opacity-100">
                    Backend response
                  </summary>
                  <pre className="mt-1 text-xs whitespace-pre-wrap break-words opacity-80 max-h-32 overflow-y-auto">
                    {deleteProgress.backendResponse}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}

        <AlertDialogFooter>
          {isDone ? (
            <AlertDialogAction>Done</AlertDialogAction>
          ) : (
            <>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onConfirm(item)}
                disabled={loading}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {loading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
