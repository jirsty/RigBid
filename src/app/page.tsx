import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { db } from "@/lib/db";
import {
  Truck,
  Shield,
  Search,
  Gavel,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Users,
  Clock,
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
      {/* Hero */}
      <section className="relative bg-navy-950 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-navy-800 via-navy-950 to-navy-950" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              The Auction Platform for{" "}
              <span className="text-brand-500">Semi Trucks</span>
            </h1>
            <p className="mt-6 text-lg text-gray-300 sm:text-xl">
              Buy and sell semi trucks through curated, time-limited auctions.
              Transparent pricing, verified sellers, and a community that knows
              trucks.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/auctions">
                <Button size="lg" className="w-full sm:w-auto">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Auctions
                </Button>
              </Link>
              <Link href="/dashboard/listings/new">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-navy-800 hover:text-white sm:w-auto"
                >
                  <Gavel className="mr-2 h-5 w-5" />
                  Sell Your Truck
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-b border-gray-200 bg-gray-50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Verified Sellers
                </p>
                <p className="text-xs text-gray-500">Every listing reviewed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Transparent Pricing
                </p>
                <p className="text-xs text-gray-500">Public bid history</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Inspections Available
                </p>
                <p className="text-xs text-gray-500">
                  Independent verified reports
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Community Driven
                </p>
                <p className="text-xs text-gray-500">
                  Comments & expert questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ending Soon */}
      {activeListings.length > 0 && (
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  <Clock className="mr-2 inline-block h-6 w-6 text-brand-600" />
                  Ending Soon
                </h2>
                <p className="mt-1 text-gray-500">
                  Don&apos;t miss out on these active auctions
                </p>
              </div>
              <Link
                href="/auctions?sort=ending"
                className="hidden items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:flex"
              >
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {activeListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>

            <div className="mt-6 text-center sm:hidden">
              <Link href="/auctions?sort=ending">
                <Button variant="outline">View All Auctions</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="border-t border-gray-200 bg-gray-50 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Recent Results
                </h2>
                <p className="mt-1 text-gray-500">
                  See what trucks sold for — research the market
                </p>
              </div>
              <Link
                href="/results"
                className="hidden items-center text-sm font-medium text-brand-600 hover:text-brand-700 sm:flex"
              >
                View all results
                <ArrowRight className="ml-1 h-4 w-4" />
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
        <section className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <Truck className="mx-auto h-16 w-16 text-gray-300" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              No Active Auctions Yet
            </h2>
            <p className="mt-2 text-gray-500">
              Be the first to list your truck on RigBid and reach thousands of
              qualified buyers.
            </p>
            <Link href="/dashboard/listings/new" className="mt-6 inline-block">
              <Button size="lg">
                <Gavel className="mr-2 h-5 w-5" />
                List Your Truck
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="border-t border-gray-200 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-2 text-gray-500">
              Simple, transparent, and built for the trucking industry
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">List Your Truck</h3>
              <p className="mt-2 text-sm text-gray-500">
                Upload photos, enter specs, set your price. Our team reviews
                every listing for quality.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">
                Watch the Bids Roll In
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                7-day auctions with real-time bidding. Buyers ask questions in
                the comments. Transparent and engaging.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">Close the Deal</h3>
              <p className="mt-2 text-sm text-gray-500">
                Secure payments through Stripe. Coordinate pickup or shipping.
                Done.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link href="/how-it-works">
              <Button variant="outline">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to buy or sell?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Join the premier auction platform for semi trucks. List for just $99.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/auctions">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-navy-800 hover:text-white sm:w-auto"
              >
                Browse Auctions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
