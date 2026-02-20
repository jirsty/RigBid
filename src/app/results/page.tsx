import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ListingCard } from "@/components/listings/listing-card";
import { Truck } from "lucide-react";
import { ResultsSearch } from "./results-search";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Auction Results | RigBid",
  description:
    "Browse completed semi truck auction results. See what trucks sold for and research market values.",
};

interface ResultsPageProps {
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

async function getResults(
  params: Record<string, string | string[] | undefined>,
) {
  const query = getStringParam(params, "q");

  const where: Prisma.ListingWhereInput = {
    status: { in: ["ENDED", "SOLD"] },
  };

  if (query && query.trim().length > 0) {
    const search = query.trim();
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { make: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ];
  }

  const listings = await db.listing.findMany({
    where,
    include: {
      photos: {
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { comments: true } },
      transaction: {
        select: { salePrice: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return listings;
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const params = await searchParams;
  const listings = await getResults(params);
  const currentQuery = (
    Array.isArray(params.q) ? params.q[0] : params.q
  ) ?? "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Auction Results
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Browse completed auctions and research market values
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-8">
        <ResultsSearch defaultValue={currentQuery} />
      </div>

      {/* Result count */}
      <p className="mb-4 text-sm text-gray-500">
        {listings.length} {listings.length === 1 ? "result" : "results"} found
        {currentQuery && (
          <span>
            {" "}for <span className="font-medium text-gray-900">&quot;{currentQuery}&quot;</span>
          </span>
        )}
      </p>

      {/* Listings grid */}
      {listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16">
          <Truck className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No results found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {currentQuery
              ? "Try a different search term to find completed auctions."
              : "There are no completed auctions yet. Check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
