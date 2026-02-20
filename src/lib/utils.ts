import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function getBidIncrement(currentBidCents: number): number {
  if (currentBidCents < 500000) return 10000; // $100 under $5K
  if (currentBidCents < 2500000) return 25000; // $250 $5K-$25K
  if (currentBidCents < 10000000) return 50000; // $500 $25K-$100K
  return 100000; // $1,000 $100K+
}

export function calculateBuyerPremium(salePriceCents: number): number {
  const premium = Math.round(salePriceCents * 0.05);
  const cap = 500000; // $5,000 in cents
  return Math.min(premium, cap);
}

export function getTimeRemaining(endTime: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const total = endTime.getTime() - Date.now();
  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }
  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
