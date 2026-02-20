"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, MessageSquare, Gavel } from "lucide-react";
import { CountdownTimer } from "@/components/listings/countdown-timer";

interface ListingCardProps {
  listing: {
    id: string;
    slug: string | null;
    title: string;
    make: string;
    model: string;
    year: number;
    mileage: number | null;
    currentHighBid: number;
    startingBid: number;
    bidCount: number;
    viewCount: number;
    watchCount: number;
    hasReserve: boolean;
    reservePrice: number | null;
    auctionEndTime: Date | string | null;
    status: string;
    locationCity: string | null;
    locationState: string | null;
    listingTier: string;
    photos: {
      url: string;
      thumbnailUrl: string | null;
    }[];
    _count?: {
      comments: number;
    };
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl =
    listing.photos[0]?.thumbnailUrl ||
    listing.photos[0]?.url ||
    "/placeholder-truck.svg";

  const currentBid = listing.currentHighBid || listing.startingBid;
  const endTime = listing.auctionEndTime
    ? new Date(listing.auctionEndTime)
    : null;
  const isEnded = listing.status === "ENDED" || listing.status === "SOLD";
  const reserveMet =
    listing.hasReserve &&
    listing.reservePrice &&
    listing.currentHighBid >= listing.reservePrice;

  const href = `/auctions/${listing.slug || listing.id}`;

  return (
    <Link href={href} className="group block">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {listing.listingTier === "FEATURED" && (
            <Badge
              variant="brand"
              className="absolute left-3 top-3 shadow-sm"
            >
              Featured
            </Badge>
          )}
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <Badge
                variant={listing.status === "SOLD" ? "success" : "default"}
                className="px-4 py-1.5 text-sm"
              >
                {listing.status === "SOLD" ? "SOLD" : "Auction Ended"}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="mb-1 text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600">
            {listing.title}
          </h3>

          {listing.locationCity && listing.locationState && (
            <p className="mb-3 text-xs text-gray-500">
              {listing.locationCity}, {listing.locationState}
            </p>
          )}

          {/* Bid info */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-500">
                {isEnded
                  ? listing.status === "SOLD"
                    ? "Sold for"
                    : "Final bid"
                  : listing.bidCount > 0
                    ? "Current bid"
                    : "Starting bid"}
              </p>
              <p className="text-lg font-bold text-navy-900">
                {formatPrice(currentBid)}
              </p>
            </div>

            <div className="text-right">
              {!isEnded && endTime && (
                <CountdownTimer endTime={endTime} compact />
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Gavel className="h-3.5 w-3.5" />
              {listing.bidCount} {listing.bidCount === 1 ? "bid" : "bids"}
            </span>
            {listing._count?.comments !== undefined && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                {listing._count.comments}
              </span>
            )}
            {listing.hasReserve && !isEnded && (
              <Badge
                variant={reserveMet ? "success" : "warning"}
                className="ml-auto text-[10px]"
              >
                {reserveMet ? "Reserve Met" : "Reserve Not Met"}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
