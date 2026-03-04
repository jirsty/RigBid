import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { HeroSearch } from "@/components/hero-search";
import { db } from "@/lib/db";
import {
  Truck,
  ArrowRight,
} from "lucide-react";

async function getActiveListings() {
  return db.listing.findMany({
    where: { status: "ACTIVE" },
    include: {
      photos: {
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { comments: true } },
    },
    orderBy: { auctionEndTime: "asc" },
    take: 6,
  });
}

async function getRecentResults() {
  return db.listing.findMany({
    where: { status: { in: ["SOLD", "ENDED"] } },
    include: {
      photos: {
        take: 1,
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { comments: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 3,
  });
}

export default async function HomePage() {
  const [activeListings, recentResults] = await Promise.all([
    getActiveListings(),
    getRecentResults(),
  ]);

  return (
    <div>
      {/* Hero - compact on mobile, prominent on desktop */}
      <section className="border-b border-gray-200 bg-white py-6 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Auctions for Semi Trucks
            </h1>
            <p className="mt-2 text-sm text-gray-500 sm:mt-3 sm:text-base">
              Curated auctions with transparent bidding, verified sellers, and a community that knows trucks.
            </p>

            {/* Search bar - hidden on mobile (shown in header instead) */}
            <div className="mt-8 hidden sm:block">
              <HeroSearch />
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-sm sm:mt-6">
              <Link
                href="/auctions"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Browse All Auctions <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/dashboard/listings/new"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Sell Your Truck <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 hidden flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-gray-400 sm:mt-6 sm:flex">
              <span>Verified Sellers</span>
              <span>&middot;</span>
              <span>Public Bid History</span>
              <span>&middot;</span>
              <span>Independent Inspections</span>
              <span>&middot;</span>
              <span>Community Q&amp;A</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ending Soon */}
      {activeListings.length > 0 && (
        <section className="bg-white py-6 sm:py-10 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-baseline justify-between border-b border-gray-200 pb-3 sm:mb-6 sm:pb-4">
              <h2 className="text-xl font-bold text-gray-900">Ending Soon</h2>
              <Link
                href="/auctions?sort=ending"
                className="hidden text-sm font-medium text-brand-600 hover:text-brand-700 sm:block"
              >
                View all auctions &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            <div className="mt-4 text-center sm:hidden">
              <Link
                href="/auctions?sort=ending"
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                View all auctions &rarr;
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50 py-6 sm:py-10 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex items-baseline justify-between border-b border-gray-200 pb-3 sm:mb-6 sm:pb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Results
              </h2>
              <Link
                href="/results"
                className="hidden text-sm font-medium text-brand-600 hover:text-brand-700 sm:block"
              >
                View all results &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentResults.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Empty state when no listings */}
      {activeListings.length === 0 && recentResults.length === 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Truck className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              No Active Auctions Yet
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Be the first to list your truck on BigRigBids and reach thousands of
              qualified buyers.
            </p>
            <Link
              href="/dashboard/listings/new"
              className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              List Your Truck &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* How it works - editorial style */}
      <section className="border-t border-gray-200 bg-white py-10 lg:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 border-b border-gray-200 pb-4">
            <h2 className="text-xl font-bold text-gray-900">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-brand-600">01</p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">
                List Your Truck
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Upload photos, enter specs, and set your price. Our team reviews
                every listing for quality before it goes live.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-600">02</p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">
                Watch the Bids Roll In
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                7-day auctions with real-time bidding. Buyers ask questions in
                the comments. Transparent and engaging.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-600">03</p>
              <h3 className="mt-1 text-base font-semibold text-gray-900">
                Close the Deal
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Secure payments through Stripe. Coordinate pickup or shipping
                directly with the buyer. Done.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Learn more about the process &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* CTA - clean, bordered, minimal */}
      <section className="border-t border-gray-200 bg-gray-50 py-10 lg:py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900">
            Ready to buy or sell?
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Join the auction platform built for the trucking industry. Listing
            fee starts at $99.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="default">Get Started</Button>
            </Link>
            <Link
              href="/auctions"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Browse Auctions &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
