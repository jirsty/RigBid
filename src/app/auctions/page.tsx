import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Truck } from "lucide-react";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Browse Semi Truck Auctions | RigBid",
  description:
    "Browse active semi truck auctions. Filter by make, year, mileage, price, and more. Find your next Freightliner, Peterbilt, Kenworth, or Volvo.",
};

interface AuctionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getStringParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const val = params[key];
  if (Array.isArray(val)) return val[0];
  return val;
}

function getIntParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): number | undefined {
  const str = getStringParam(params, key);
  if (!str) return undefined;
  const n = parseInt(str, 10);
  return isNaN(n) ? undefined : n;
}

async function getListings(
  params: Record<string, string | string[] | undefined>,
) {
  const make = getStringParam(params, "make");
  const yearMin = getIntParam(params, "yearMin");
  const yearMax = getIntParam(params, "yearMax");
  const mileageMin = getIntParam(params, "mileageMin");
  const mileageMax = getIntParam(params, "mileageMax");
  const priceMin = getIntParam(params, "priceMin");
  const priceMax = getIntParam(params, "priceMax");
  const transmissionType = getStringParam(params, "transmissionType");
  const sleeperType = getStringParam(params, "sleeperType");
  const emissionsStandard = getStringParam(params, "emissionsStandard");
  const carbCompliant = getStringParam(params, "carbCompliant");
  const state = getStringParam(params, "state");
  const sort = getStringParam(params, "sort") ?? "ending";
  const includeEnded = getStringParam(params, "includeEnded") === "true";

  // Build where clause
  const where: Prisma.ListingWhereInput = {};

  // Status filter
  if (includeEnded) {
    where.status = { in: ["ACTIVE", "ENDED", "SOLD"] };
  } else {
    where.status = "ACTIVE";
  }

  // Make filter (comma-separated)
  if (make) {
    const makes = make.split(",").filter(Boolean);
    if (makes.length > 0) {
      where.make = { in: makes };
    }
  }

  // Year range
  if (yearMin || yearMax) {
    where.year = {};
    if (yearMin) where.year.gte = yearMin;
    if (yearMax) where.year.lte = yearMax;
  }

  // Mileage range
  if (mileageMin || mileageMax) {
    where.mileage = {};
    if (mileageMin) where.mileage.gte = mileageMin;
    if (mileageMax) where.mileage.lte = mileageMax;
  }

  // Price range (user enters dollars, stored in cents)
  if (priceMin || priceMax) {
    where.currentHighBid = {};
    if (priceMin) where.currentHighBid.gte = priceMin * 100;
    if (priceMax) where.currentHighBid.lte = priceMax * 100;
  }

  // Transmission type
  if (transmissionType) {
    where.transmissionType = transmissionType as any;
  }

  // Sleeper type
  if (sleeperType) {
    where.sleeperType = sleeperType as any;
  }

  // Emissions standard
  if (emissionsStandard) {
    where.emissionsStandard = emissionsStandard as any;
  }

  // CARB compliant
  if (carbCompliant === "true") {
    where.carbCompliant = true;
  }

  // State
  if (state) {
    where.locationState = state;
  }

  // Build orderBy
  let orderBy: Prisma.ListingOrderByWithRelationInput;
  switch (sort) {
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "bids":
      orderBy = { bidCount: "desc" };
      break;
    case "mileage":
      orderBy = { mileage: "asc" };
      break;
    case "ending":
    default:
      orderBy = { auctionEndTime: "asc" };
      break;
  }

  const listings = await db.listing.findMany({
    where,
    include: {
      photos: {
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { comments: true } },
    },
    orderBy,
  });

  return listings;
}

export default async function AuctionsPage({ searchParams }: AuctionsPageProps) {
  const params = await searchParams;
  const listings = await getListings(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Auctions
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {listings.length} {listings.length === 1 ? "active listing" : "active listings"}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <ListingFilters totalCount={listings.length} />

        {/* Listings Grid */}
        <div className="min-w-0 flex-1">
          {/* Mobile count */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <p className="text-sm text-gray-500">
              {listings.length} {listings.length === 1 ? "result" : "results"}
            </p>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                <Truck className="h-7 w-7 text-gray-400" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-gray-900">
                No listings found
              </h3>
              <p className="mt-1.5 max-w-sm text-center text-sm text-gray-500">
                Try adjusting your filters or clearing them to see more results.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
