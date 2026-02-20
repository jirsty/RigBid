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
import { formatPrice } from "@/lib/utils";
import { LISTING_FEE_STANDARD, LISTING_FEE_FEATURED } from "@/lib/constants";
import { CheckCircle, Star, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ListingSummary {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  status: string;
}

export default function ListingPaymentPage() {
  const params = useParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<ListingSummary | null>(null);
  const [selectedTier, setSelectedTier] = useState<"STANDARD" | "FEATURED">(
    "STANDARD"
  );
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
        setError("Could not load listing details.");
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
          type: "listing_fee",
          tier: selectedTier,
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
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
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
        <Link href="/dashboard/listings" className="mt-4 inline-block">
          <Button variant="outline">Back to Listings</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/dashboard/listings"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Listings
      </Link>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        Pay Listing Fee
      </h1>
      <p className="mb-8 text-gray-500">
        Choose a listing tier and complete payment to submit your listing for
        review.
      </p>

      {listing && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Listing Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-gray-900">{listing.title}</p>
            <p className="text-sm text-gray-500">
              {listing.year} {listing.make} {listing.model}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* Standard Tier */}
        <button
          type="button"
          onClick={() => setSelectedTier("STANDARD")}
          className={`relative rounded-lg border-2 p-6 text-left transition-all ${
            selectedTier === "STANDARD"
              ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          {selectedTier === "STANDARD" && (
            <CheckCircle className="absolute right-4 top-4 h-5 w-5 text-brand-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">Standard</h3>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {formatPrice(LISTING_FEE_STANDARD)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Basic auction listing
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              7-day auction duration
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Standard search placement
            </li>
          </ul>
        </button>

        {/* Featured Tier */}
        <button
          type="button"
          onClick={() => setSelectedTier("FEATURED")}
          className={`relative rounded-lg border-2 p-6 text-left transition-all ${
            selectedTier === "FEATURED"
              ? "border-brand-600 bg-brand-50 ring-1 ring-brand-600"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <Badge variant="brand" className="absolute right-4 top-4">
            <Star className="mr-1 h-3 w-3" />
            Popular
          </Badge>
          {selectedTier === "FEATURED" && (
            <CheckCircle className="absolute right-12 top-4 h-5 w-5 text-brand-600" />
          )}
          <h3 className="text-lg font-semibold text-gray-900">Featured</h3>
          <p className="mt-1 text-3xl font-bold text-gray-900">
            {formatPrice(LISTING_FEE_FEATURED)}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Everything in Standard
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Priority placement in search
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Highlighted listing badge
            </li>
            <li className="flex items-start">
              <CheckCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              Featured on homepage
            </li>
          </ul>
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              {selectedTier === "FEATURED" ? "Featured" : "Standard"} Listing
              Fee
            </span>
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(
                selectedTier === "FEATURED"
                  ? LISTING_FEE_FEATURED
                  : LISTING_FEE_STANDARD
              )}
            </span>
          </div>
        </CardContent>
        <CardFooter>
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
              `Pay ${formatPrice(
                selectedTier === "FEATURED"
                  ? LISTING_FEE_FEATURED
                  : LISTING_FEE_STANDARD
              )}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
