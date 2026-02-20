import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpecSheet } from "@/components/listings/spec-sheet";
import { AdminReviewActions } from "./review-actions";
import {
  ArrowLeft,
  MapPin,
  User,
  Mail,
  Calendar,
  Gavel,
  Eye,
} from "lucide-react";

export const metadata = {
  title: "Review Listing - Admin",
};

const STATUS_BADGE_MAP: Record<
  string,
  "default" | "brand" | "success" | "warning" | "danger" | "navy"
> = {
  DRAFT: "default",
  PENDING_REVIEW: "warning",
  ACTIVE: "success",
  ENDED: "navy",
  SOLD: "brand",
  CANCELLED: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending Review",
  ACTIVE: "Active",
  ENDED: "Ended",
  SOLD: "Sold",
  CANCELLED: "Cancelled",
};

export default async function AdminListingReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const listing = await db.listing.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          verificationStatus: true,
          createdAt: true,
        },
      },
      photos: { orderBy: { sortOrder: "asc" } },
      _count: { select: { bids: true, comments: true } },
    },
  });

  if (!listing) {
    notFound();
  }

  const isPending = listing.status === "PENDING_REVIEW";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/listings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {listing.title}
            </h1>
            <div className="mt-1 flex items-center gap-3">
              <Badge variant={STATUS_BADGE_MAP[listing.status] || "default"}>
                {STATUS_LABELS[listing.status] || listing.status}
              </Badge>
              <span className="text-sm text-gray-500">
                ID: {listing.id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content - left 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Photos ({listing.photos.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {listing.photos.length === 0 ? (
                <p className="py-4 text-sm text-gray-500">
                  No photos uploaded.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {listing.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                    >
                      <Image
                        src={photo.thumbnailUrl || photo.url}
                        alt={photo.caption || photo.category}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-xs text-white">
                          {photo.category.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specs */}
          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <SpecSheet listing={listing} />
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {listing.description ? (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{listing.description}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No description provided.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - right col */}
        <div className="space-y-6">
          {/* Admin actions */}
          {isPending && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">
                  Review Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdminReviewActions listingId={listing.id} />
              </CardContent>
            </Card>
          )}

          {/* Auction details */}
          <Card>
            <CardHeader>
              <CardTitle>Auction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Starting Bid</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(listing.startingBid)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current High Bid</span>
                <span className="font-medium text-gray-900">
                  {listing.currentHighBid > 0
                    ? formatPrice(listing.currentHighBid)
                    : "--"}
                </span>
              </div>
              {listing.hasReserve && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Reserve Price</span>
                  <span className="font-medium text-gray-900">
                    {listing.reservePrice
                      ? formatPrice(listing.reservePrice)
                      : "--"}
                  </span>
                </div>
              )}
              {listing.buyNowPrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Buy Now Price</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(listing.buyNowPrice)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tier</span>
                <Badge
                  variant={
                    listing.listingTier === "FEATURED" ? "brand" : "default"
                  }
                >
                  {listing.listingTier}
                </Badge>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Gavel className="h-4 w-4" />
                    {listing._count.bids} bids
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatNumber(listing.viewCount)} views
                  </span>
                </div>
              </div>
              {listing.auctionStartTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Auction Start</span>
                  <span className="text-gray-700">
                    {new Date(listing.auctionStartTime).toLocaleString()}
                  </span>
                </div>
              )}
              {listing.auctionEndTime && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Auction End</span>
                  <span className="text-gray-700">
                    {new Date(listing.auctionEndTime).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {(listing.locationCity || listing.locationState) && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {[listing.locationCity, listing.locationState, listing.locationZip]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seller info */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">
                  {listing.seller.name || "No name"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{listing.seller.email}</span>
              </div>
              {listing.seller.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-700">{listing.seller.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">
                  Joined{" "}
                  {new Date(listing.seller.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <Badge
                  variant={
                    listing.seller.verificationStatus === "UNVERIFIED"
                      ? "warning"
                      : "success"
                  }
                >
                  {listing.seller.verificationStatus.replace(/_/g, " ")}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle>Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {new Date(listing.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-700">
                  {new Date(listing.updatedAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
