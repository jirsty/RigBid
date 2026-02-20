import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type ListingStatus } from "@prisma/client";

export const metadata = {
  title: "All Listings - Admin",
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending Review", value: "PENDING_REVIEW" },
  { label: "Active", value: "ACTIVE" },
  { label: "Ended", value: "ENDED" },
  { label: "Sold", value: "SOLD" },
  { label: "Draft", value: "DRAFT" },
  { label: "Cancelled", value: "CANCELLED" },
] as const;

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

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as ListingStatus | undefined;

  const whereClause = statusFilter ? { status: statusFilter } : {};

  const listings = await db.listing.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      seller: { select: { id: true, name: true, email: true } },
      _count: { select: { bids: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">All Listings</h1>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const isActive = (statusFilter || "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={
                tab.value
                  ? `/admin/listings?status=${tab.value}`
                  : "/admin/listings"
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Listings table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {statusFilter
              ? `${STATUS_LABELS[statusFilter] || statusFilter} Listings`
              : "All Listings"}
            <span className="ml-2 text-base font-normal text-gray-500">
              ({listings.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No listings found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Title
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Seller
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-right">
                      Current Bid
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-right">
                      Bids
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Created
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Auction End
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listings.map((listing) => (
                    <tr
                      key={listing.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="max-w-[250px] truncate px-4 py-3 font-medium text-gray-900">
                        {listing.title}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {listing.seller.name || listing.seller.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant={STATUS_BADGE_MAP[listing.status] || "default"}
                        >
                          {STATUS_LABELS[listing.status] || listing.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-gray-900">
                        {listing.currentHighBid > 0
                          ? formatPrice(listing.currentHighBid)
                          : formatPrice(listing.startingBid)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                        {listing._count.bids}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {listing.auctionEndTime
                          ? new Date(
                              listing.auctionEndTime
                            ).toLocaleDateString()
                          : "--"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/listings/${listing.id}`}
                          className="text-sm font-medium text-brand-600 hover:text-brand-700"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
