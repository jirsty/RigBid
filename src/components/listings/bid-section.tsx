"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Gavel, AlertTriangle, TrendingUp, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      map.set(bid.bidderId, `Bidder #${counter}`);
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

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5 text-brand-600" />
            {isEnded || auctionEnded ? "Auction Ended" : "Place Your Bid"}
          </CardTitle>
          {hasReserve && !isEnded && !auctionEnded && (
            <Badge variant={reserveMet ? "success" : "warning"}>
              {reserveMet ? "Reserve Met" : "Reserve Not Met"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Current bid */}
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {bidCount > 0 ? "Current High Bid" : "Starting Bid"}
          </p>
          <p className="mt-1 text-3xl font-bold text-navy-900">
            {formatPrice(activeBid)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {bidCount} {bidCount === 1 ? "bid" : "bids"}
          </p>
        </div>

        {/* Countdown */}
        {endTime && !auctionEnded && (
          <div className="flex justify-center">
            <CountdownTimer
              endTime={endTime}
              onEnd={() => setAuctionEnded(true)}
            />
          </div>
        )}

        {/* Anti-snipe notice */}
        {isAntiSnipeWindow && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
            <p className="text-xs text-yellow-800">
              Less than 2 minutes remain. Any bid placed will extend the auction
              by 2 minutes to prevent sniping.
            </p>
          </div>
        )}

        {/* Bid form (only if auction is active and not ended) */}
        {isActive && !auctionEnded && (
          <>
            {session?.user ? (
              <div className="space-y-3">
                {/* Increment buttons + input */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustBid("down")}
                    disabled={bidAmountCents <= minimumBid}
                    aria-label="Decrease bid"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => adjustBid("up")}
                    aria-label="Increase bid"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Bid increment info */}
                <p className="text-center text-xs text-gray-500">
                  Minimum bid: {formatPrice(minimumBid)} (increment:{" "}
                  {formatPrice(increment)})
                </p>

                {/* Place bid button */}
                <Button
                  onClick={handlePlaceBid}
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  {isSubmitting
                    ? "Placing Bid..."
                    : `Place Bid ${formatPrice(bidAmountCents)}`}
                </Button>

                {/* Error / success */}
                {error && (
                  <p className="text-center text-sm font-medium text-red-600">
                    {error}
                  </p>
                )}
                {successMessage && (
                  <p className="text-center text-sm font-medium text-green-600">
                    {successMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                <p className="mb-2 text-sm text-gray-600">
                  Sign in to place a bid
                </p>
                <Link href="/auth/signin">
                  <Button variant="default" size="sm">Sign In</Button>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Bid increment rules */}
        {isActive && !auctionEnded && (
          <div className="space-y-1 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700">
              Bid Increment Rules
            </p>
            <ul className="space-y-0.5 text-xs text-gray-500">
              <li>Under $5,000: $100 increments</li>
              <li>$5,000 &ndash; $24,999: $250 increments</li>
              <li>$25,000 &ndash; $99,999: $500 increments</li>
              <li>$100,000+: $1,000 increments</li>
            </ul>
          </div>
        )}

        {/* Bid history */}
        {bids.length > 0 && (
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-700">Bid History</p>
            <div className="max-h-64 space-y-1.5 overflow-y-auto">
              {bids.map((bid, idx) => {
                const label = bidderLabels.get(bid.bidderId) ?? `Bidder #${idx + 1}`;
                const date = new Date(bid.createdAt);

                return (
                  <div
                    key={bid.id}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                      idx === 0
                        ? "bg-brand-50 font-semibold text-brand-800"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span>{label}</span>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatPrice(bid.amount)}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
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
      </CardContent>
    </Card>
  );
}
