import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ClipboardList,
  Pencil,
  ExternalLink,
  Clock,
  Gavel,
} from "lucide-react";
import { CountdownTimer } from "@/components/listings/countdown-timer";

type ListingStatus = "ALL" | "DRAFT" | "ACTIVE" | "ENDED" | "SOLD";

const STATUS_TABS: { value: ListingStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "ENDED", label: "Ended" },
  { value: "SOLD", label: "Sold" },
];

function getStatusBadgeVariant(
  status: string
): "default" | "brand" | "success" | "warning" | "danger" | "navy" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "DRAFT":
      return "default";
    case "PENDING_REVIEW":
      return "warning";
    case "SOLD":
      return "brand";
    case "ENDED":
      return "navy";
    case "CANCELLED":
      return "danger";
    default:
      return "default";
  }
}

async function getSellerListings(userId: string, status: ListingStatus) {
  const where: Record<string, unknown> = { sellerId: userId };
  if (status !== "ALL") {
    where.status = status;
  }

  return db.listing.findMany({
    where,
    include: {
      photos: {
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const params = await searchParams;
  const currentStatus = (params.status?.toUpperCase() || "ALL") as ListingStatus;
  const validStatus = STATUS_TABS.find((t) => t.value === currentStatus)
    ? currentStatus
    : "ALL";

  const listings = await getSellerListings(session.user.id, validStatus);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your truck auction listings
          </p>
        </div>
        <Link href="/dashboard/listings/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Listing
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={
              tab.value === "ALL"
                ? "/dashboard/listings"
                : `/dashboard/listings?status=${tab.value.toLowerCase()}`
            }
            className={`flex-shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              validStatus === tab.value
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No listings found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {validStatus === "ALL"
                ? "You haven't created any listings yet."
                : `You don't have any ${validStatus.toLowerCase()} listings.`}
            </p>
            <Link href="/dashboard/listings/new" className="mt-4 inline-block">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Your First Listing
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const imageUrl =
              listing.photos[0]?.thumbnailUrl ||
              listing.photos[0]?.url ||
              null;
            const endTime = listing.auctionEndTime
              ? new Date(listing.auctionEndTime)
              : null;
            const isEditable =
              listing.status === "DRAFT" ||
              listing.status === "PENDING_REVIEW";

            return (
              <Card key={listing.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div className="relative h-32 w-full flex-shrink-0 bg-gray-100 sm:h-auto sm:w-40">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover"
                          sizes="160px"
                        />
                      ) : (
                        <div className="flex h-full min-h-[128px] items-center justify-center">
                          <ClipboardList className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {listing.title}
                          </h3>
                          <Badge
                            variant={getStatusBadgeVariant(listing.status)}
                            className="flex-shrink-0"
                          >
                            {listing.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Gavel className="h-3.5 w-3.5" />
                            {listing.bidCount}{" "}
                            {listing.bidCount === 1 ? "bid" : "bids"}
                          </span>
                          {listing.currentHighBid > 0 && (
                            <span>
                              High bid: {formatPrice(listing.currentHighBid)}
                            </span>
                          )}
                          {listing.status === "ACTIVE" && endTime && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              <CountdownTimer endTime={endTime} compact />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        {isEditable && (
                          <Link
                            href={`/dashboard/listings/${listing.id}/edit`}
                          >
                            <Button variant="outline" size="sm">
                              <Pencil className="mr-1.5 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </Link>
                        )}
                        <Link
                          href={`/auctions/${listing.slug || listing.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
