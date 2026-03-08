import React, { useMemo, useState } from "react";
import { AlertTriangleIcon, CheckCircle2Icon, ChevronDownIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatStepTime(isoString) {
  if (!isoString) return "";
  const value = new Date(isoString);
  if (Number.isNaN(value.getTime())) return "";
  return value.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function StatusIcon({ status }) {
  if (status === "completed") {
    return <CheckCircle2Icon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
  }
  if (status === "error") {
    return <AlertTriangleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
  }
  if (status === "running") {
    return <Loader2Icon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-spin" />;
  }
  return <div className="w-2 h-2 rounded-full bg-slate-400 shrink-0 mt-1.5" />;
}

export function ExecutionTimeline({
  steps,
  heading = "Execution timeline",
  defaultExpanded = false,
  className = "",
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const stats = useMemo(() => {
    const running = steps.filter((step) => step.status === "running").length;
    const failed = steps.filter((step) => step.status === "error").length;
    return { running, failed };
  }, [steps]);

  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <div className={`rounded-lg border bg-background/90 ${className}`}>
      <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-b">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {heading}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {steps.length} step{steps.length === 1 ? "" : "s"}
            {stats.running ? ` · ${stats.running} running` : ""}
            {stats.failed ? ` · ${stats.failed} failed` : ""}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={() => setExpanded((prev) => !prev)}
          title={expanded ? "Collapse timeline" : "Expand timeline"}
        >
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {expanded && (
        <div className="max-h-52 overflow-y-auto p-2 space-y-1.5">
          {steps.map((step) => (
            <div key={step.id} className="rounded-md border bg-muted/30 px-2 py-1.5">
              <div className="flex items-start gap-2">
                <StatusIcon status={step.status} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-medium break-words">{step.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatStepTime(step.updatedAt || step.at)}
                    </span>
                  </div>
                  {step.detail ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground break-words">
                      {step.detail}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
