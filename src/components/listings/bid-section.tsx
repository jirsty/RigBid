"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AlertTriangle, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountdownTimer } from "@/components/listings/countdown-timer";
import { formatPrice, getBidIncrement } from "@/lib/utils";
import { ANTI_SNIPE_WINDOW_MS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bid {
  id: string;
  amount: number; // cents
  createdAt: string | Date;
  bidderId: string;
}

interface BidSectionProps {
  listingId: string;
  currentHighBid: number; // cents
  startingBid: number; // cents
  hasReserve: boolean;
  reservePrice: number | null; // cents
  auctionEndTime: string | Date | null;
  bidCount: number;
  bids: Bid[];
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Assign anonymous bidder labels based on unique bidder IDs,
 * ordered by first appearance (highest bid first since bids are desc).
 */
function buildBidderLabels(bids: Bid[]): Map<string, string> {
  const map = new Map<string, string>();
  let counter = 1;
  for (const bid of bids) {
    if (!map.has(bid.bidderId)) {
      map.set(bid.bidderId, `Bidder ${counter}`);
      counter++;
    }
  }
  return map;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BidSection({
  listingId,
  currentHighBid,
  startingBid,
  hasReserve,
  reservePrice,
  auctionEndTime,
  bidCount,
  bids,
  status,
}: BidSectionProps) {
  const { data: session } = useSession();

  const endTime = auctionEndTime ? new Date(auctionEndTime) : null;
  const isActive = status === "ACTIVE";
  const isEnded = status === "ENDED" || status === "SOLD";

  const activeBid = currentHighBid || startingBid;
  const increment = getBidIncrement(activeBid);
  const minimumBid = bidCount > 0 ? activeBid + increment : startingBid;

  const [bidAmountCents, setBidAmountCents] = useState(minimumBid);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [auctionEnded, setAuctionEnded] = useState(isEnded);

  const reserveMet =
    hasReserve && reservePrice != null && activeBid >= reservePrice;

  const bidderLabels = useMemo(() => buildBidderLabels(bids), [bids]);

  // Convert cents to dollars for the input display
  const bidDollars = bidAmountCents / 100;

  // Check if within anti-snipe window
  const isAntiSnipeWindow =
    endTime && endTime.getTime() - Date.now() < ANTI_SNIPE_WINDOW_MS && !auctionEnded;

  function adjustBid(direction: "up" | "down") {
    setBidAmountCents((prev) => {
      const step = getBidIncrement(prev);
      if (direction === "up") return prev + step;
      const next = prev - step;
      return next >= minimumBid ? next : minimumBid;
    });
    setError(null);
    setSuccessMessage(null);
  }

  function handleDollarsChange(value: string) {
    const dollars = parseFloat(value);
    if (!isNaN(dollars)) {
      setBidAmountCents(Math.round(dollars * 100));
    }
    setError(null);
    setSuccessMessage(null);
  }

  async function handlePlaceBid() {
    if (!session?.user) return;

    if (bidAmountCents < minimumBid) {
      setError(`Minimum bid is ${formatPrice(minimumBid)}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          amount: bidAmountCents,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to place bid");
      }

      setSuccessMessage(`Bid of ${formatPrice(bidAmountCents)} placed!`);
      // Bump the input to next increment above current bid
      const newMin = bidAmountCents + getBidIncrement(bidAmountCents);
      setBidAmountCents(newMin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place bid");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reserve status label
  const reserveLabel = !hasReserve
    ? "No Reserve"
    : reserveMet
      ? "Reserve Met"
      : "Reserve Not Met";

  const reserveColor = !hasReserve
    ? "text-bat-green"
    : reserveMet
      ? "text-bat-green"
      : "text-gray-400";

  return (
    <div className="sticky top-4 rounded-lg border border-gray-200 bg-white">
      {/* ── Header bar ── */}
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-navy-700">
            {isEnded || auctionEnded ? "Auction Ended" : "Current Bid"}
          </h3>
          {!isEnded && !auctionEnded && (
            <span className={`text-xs font-semibold uppercase tracking-wide ${reserveColor}`}>
              {reserveLabel}
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* ── Current bid display ── */}
        <div className="text-center">
          <p className="text-4xl font-bold tracking-tight text-navy-900">
            {formatPrice(activeBid)}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </p>
        </div>

        {/* ── Countdown ── */}
        {endTime && !auctionEnded && (
          <div className="flex justify-center border-t border-gray-100 pt-4">
            <CountdownTimer
              endTime={endTime}
              onEnd={() => setAuctionEnded(true)}
            />
          </div>
        )}

        {/* ── Anti-snipe notice ── */}
        {isAntiSnipeWindow && (
          <div className="flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50/60 px-3 py-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-700">
              Less than 2 minutes remain. Any bid placed will extend the auction
              by 2 minutes to prevent sniping.
            </p>
          </div>
        )}

        {/* ── Bid form ── */}
        {isActive && !auctionEnded && (
          <>
            {session?.user ? (
              <div className="space-y-3">
                {/* Increment buttons + input */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustBid("down")}
                    disabled={bidAmountCents <= minimumBid}
                    aria-label="Decrease bid"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                      $
                    </span>
                    <Input
                      type="number"
                      value={bidDollars}
                      onChange={(e) => handleDollarsChange(e.target.value)}
                      className="pl-7 text-center text-lg font-semibold"
                      min={minimumBid / 100}
                      step={increment / 100}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustBid("up")}
                    aria-label="Increase bid"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Bid increment info */}
                <p className="text-center text-xs text-gray-400">
                  Min {formatPrice(minimumBid)} &middot; {formatPrice(increment)}{" "}
                  increments
                </p>

                {/* Place bid button */}
                <Button
                  onClick={handlePlaceBid}
                  disabled={isSubmitting}
                  className="w-full bg-brand-600 text-white hover:bg-brand-700"
                  size="lg"
                >
                  {isSubmitting
                    ? "Placing Bid..."
                    : `Place Bid \u2014 ${formatPrice(bidAmountCents)}`}
                </Button>

                {/* Error / success */}
                {error && (
                  <p className="text-center text-sm text-red-600">{error}</p>
                )}
                {successMessage && (
                  <p className="text-center text-sm text-bat-green">
                    {successMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4 text-center">
                <p className="mb-3 text-sm text-gray-500">
                  Sign in to place a bid
                </p>
                <Link href="/auth/signin">
                  <Button variant="default" size="sm">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}

        {/* ── Bid increment rules ── */}
        {isActive && !auctionEnded && (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Bid Increments
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-500">
              <span>Under $5,000</span>
              <span className="text-right">$100</span>
              <span>$5,000 &ndash; $24,999</span>
              <span className="text-right">$250</span>
              <span>$25,000 &ndash; $99,999</span>
              <span className="text-right">$500</span>
              <span>$100,000+</span>
              <span className="text-right">$1,000</span>
            </div>
          </div>
        )}

        {/* ── Bid history ── */}
        {bids.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Bid History
            </p>
            <div className="max-h-64 overflow-y-auto">
              {bids.map((bid, idx) => {
                const label =
                  bidderLabels.get(bid.bidderId) ?? `Bidder ${idx + 1}`;
                const date = new Date(bid.createdAt);

                return (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between border-b border-gray-50 px-2 py-2 text-sm last:border-b-0 ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <span
                      className={`${
                        idx === 0
                          ? "font-semibold text-navy-900"
                          : "text-gray-600"
                      }`}
                    >
                      {label}
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span
                        className={`font-medium ${
                          idx === 0 ? "text-navy-900" : "text-gray-700"
                        }`}
                      >
                        {formatPrice(bid.amount)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {date.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
