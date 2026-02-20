"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, calculateBuyerPremium } from "@/lib/utils";
import { Loader2, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PurchaseDetails {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number | null;
  currentHighBid: number;
  status: string;
  locationCity: string | null;
  locationState: string | null;
}

export default function BuyerPremiumPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`);
        if (!res.ok) throw new Error("Failed to load listing");
        const data = await res.json();
        setListing(data);
      } catch {
        setError("Could not load purchase details.");
      } finally {
        setLoading(false);
      }
    }
    fetchListing();
  }, [listingId]);

  async function handlePayment() {
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          type: "buyer_premium",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/dashboard" className="mt-4 inline-block">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (!listing) return null;

  const winningBid = listing.currentHighBid;
  const buyerPremium = calculateBuyerPremium(winningBid);
  const total = winningBid + buyerPremium;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Complete Your Purchase
          </h1>
          <Badge variant="success">Auction Won</Badge>
        </div>
        <p className="mt-2 text-gray-500">
          Pay the buyer premium to finalize your winning bid.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5 text-gray-400" />
            Truck Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <h3 className="text-lg font-semibold text-gray-900">
            {listing.title}
          </h3>
          <p className="text-sm text-gray-500">
            {listing.year} {listing.make} {listing.model}
          </p>
          {listing.mileage && (
            <p className="text-sm text-gray-500">
              {listing.mileage.toLocaleString()} miles
            </p>
          )}
          {listing.locationCity && listing.locationState && (
            <p className="text-sm text-gray-500">
              {listing.locationCity}, {listing.locationState}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Payment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-gray-600">
            <span>Winning Bid</span>
            <span className="font-medium text-gray-900">
              {formatPrice(winningBid)}
            </span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>
              Buyer Premium{" "}
              <span className="text-xs text-gray-400">
                (5%, capped at $5,000)
              </span>
            </span>
            <span className="font-medium text-gray-900">
              {formatPrice(buyerPremium)}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total Due</span>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(total)}
              </span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {error && (
            <div className="w-full rounded-md bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button
            size="lg"
            className="w-full"
            onClick={handlePayment}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              `Pay Buyer Premium ${formatPrice(buyerPremium)}`
            )}
          </Button>
          <p className="text-center text-xs text-gray-400">
            The winning bid amount is settled separately between buyer and
            seller. This payment covers the RigBid buyer premium only.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
