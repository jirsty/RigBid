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
      <div className="overflow-hidden rounded-lg bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-200">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {isEnded && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="rounded bg-white/95 px-5 py-2 text-sm font-bold tracking-wide text-gray-900 uppercase">
                {listing.status === "SOLD" ? "Sold" : "Ended"}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pt-3 pb-4">
          {/* Title */}
          <h3 className="text-base leading-snug font-semibold text-gray-900 line-clamp-2 group-hover:text-brand-600 transition-colors duration-150">
            {listing.title}
          </h3>

          {/* Location */}
          {listing.locationCity && listing.locationState && (
            <p className="mt-1 text-sm text-gray-400">
              {listing.locationCity}, {listing.locationState}
            </p>
          )}

          {/* Bid + Timer row */}
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                {isEnded
                  ? listing.status === "SOLD"
                    ? "Sold for"
                    : "Final bid"
                  : listing.bidCount > 0
                    ? "Current bid"
                    : "Starting bid"}
              </p>
              <p className="text-xl font-bold tracking-tight text-gray-900">
                {formatPrice(currentBid)}
              </p>
            </div>

            <div className="text-right">
              {!isEnded && endTime && (
                <CountdownTimer endTime={endTime} compact />
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-3 border-t border-gray-100 pt-3 text-xs text-gray-400">
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
            <span className="ml-auto text-xs font-semibold">
              {!listing.hasReserve ? (
                <span className="text-bat-green">No Reserve</span>
              ) : isEnded ? null : reserveMet ? (
                <span className="text-bat-green">Reserve Met</span>
              ) : (
                <span className="text-gray-400">Reserve</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
