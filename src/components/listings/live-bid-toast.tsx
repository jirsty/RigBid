"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Gavel, Clock, Trophy, TrendingUp } from "lucide-react";

// ─── Toast types ─────────────────────────────────────────────────────────────

type ToastType = "bid" | "reserve-met" | "auction-extended" | "auction-ended";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  amount?: number;
  visible: boolean;
}

// ─── Config per toast type ───────────────────────────────────────────────────

const toastConfig: Record<
  ToastType,
  {
    icon: typeof Gavel;
    bg: string;
    border: string;
    iconColor: string;
  }
> = {
  bid: {
    icon: Gavel,
    bg: "bg-white",
    border: "border-brand-500",
    iconColor: "text-brand-600",
  },
  "reserve-met": {
    icon: TrendingUp,
    bg: "bg-emerald-50",
    border: "border-emerald-500",
    iconColor: "text-emerald-600",
  },
  "auction-extended": {
    icon: Clock,
    bg: "bg-amber-50",
    border: "border-amber-500",
    iconColor: "text-amber-600",
  },
  "auction-ended": {
    icon: Trophy,
    bg: "bg-navy-50",
    border: "border-navy-600",
    iconColor: "text-navy-700",
  },
};

// ─── Global toast manager ────────────────────────────────────────────────────

let toastIdCounter = 0;
let addToastCallback: ((toast: Omit<Toast, "id" | "visible">) => void) | null =
  null;

/**
 * Imperatively show a live-bid toast from anywhere.
 */
export function showBidToast(
  type: ToastType,
  message: string,
  amount?: number
): void {
  addToastCallback?.({ type, message, amount });
}

// ─── Component ───────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 5_000;
const MAX_TOASTS = 5;

export function LiveBidToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, "id" | "visible">) => {
      const id = `toast-${++toastIdCounter}`;
      setToasts((prev) => {
        const next = [...prev, { ...toast, id, visible: false }];
        // Cap the visible stack
        return next.slice(-MAX_TOASTS);
      });

      // Trigger enter animation on next frame
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, visible: true } : t))
        );
      });

      // Auto-dismiss
      setTimeout(() => {
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
        );
        // Remove from DOM after exit animation
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
      }, AUTO_DISMISS_MS);
    },
    []
  );

  // Register the imperative callback
  useEffect(() => {
    addToastCallback = addToast;
    return () => {
      addToastCallback = null;
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 rounded-lg border-l-4
              ${config.border} ${config.bg} px-4 py-3 shadow-lg
              transition-all duration-300 ease-out
              ${
                toast.visible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-8 opacity-0"
              }
            `}
            style={{ minWidth: 280, maxWidth: 380 }}
          >
            <Icon className={`h-5 w-5 shrink-0 ${config.iconColor}`} />
            <div className="min-w-0 flex-1">
              {toast.amount !== undefined && (
                <p className="text-sm font-bold text-gray-900">
                  {formatPrice(toast.amount)}
                </p>
              )}
              <p className="truncate text-sm text-gray-600">{toast.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
