"use client";

import { CheckCircle2 } from "lucide-react";
import { usePulse } from "./pulse-context";
import { cn } from "@/lib/utils";

export function Toast() {
  const { toast } = usePulse();
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300 pointer-events-none glass-panel px-4 py-2.5 rounded-2xl border border-indigo-500/30 text-white text-xs font-semibold flex items-center gap-2.5 shadow-2xl",
        toast
          ? "translate-y-0 opacity-100"
          : "translate-y-24 opacity-0",
      )}
    >
      <CheckCircle2 className="size-4 text-indigo-400" />
      <span>{toast ?? "Notification"}</span>
    </div>
  );
}
