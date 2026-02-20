import { redirect } from "next/navigation";
import Link from "next/link";
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
  ClipboardList,
  Gavel,
  Trophy,
  Heart,
  PlusCircle,
  Search,
  Eye,
  ArrowRight,
  TrendingUp,
  Clock,
} from "lucide-react";

async function getDashboardData(userId: string) {
  const [
    activeListingsCount,
    activeBidsCount,
    wonAuctionsCount,
    watchlistCount,
    recentBids,
    recentListingUpdates,
  ] = await Promise.all([
    // Active listings owned by this user
    db.listing.count({
      where: {
        sellerId: userId,
        status: "ACTIVE",
      },
    }),
    // Active bids placed by this user on active listings
    db.bid.count({
      where: {
        bidderId: userId,
        listing: { status: "ACTIVE" },
      },
    }),
    // Auctions won (transactions where user is buyer)
    db.transaction.count({
      where: {
        buyerId: userId,
      },
    }),
    // Watchlist items
    db.watchlistItem.count({
      where: {
        userId,
      },
    }),
    // Recent bids placed by this user
    db.bid.findMany({
      where: { bidderId: userId },
      include: {
        listing: {
          select: {
            id: true,
            slug: true,
            title: true,
            currentHighBid: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // Recent listing updates (user's own listings)
    db.listing.findMany({
      where: { sellerId: userId },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        currentHighBid: true,
        bidCount: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return {
    activeListingsCount,
    activeBidsCount,
    wonAuctionsCount,
    watchlistCount,
    recentBids,
    recentListingUpdates,
  };
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const data = await getDashboardData(session.user.id);

  const statCards = [
    {
      title: "Active Listings",
      value: data.activeListingsCount,
      icon: ClipboardList,
      href: "/dashboard/listings",
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Active Bids",
      value: data.activeBidsCount,
      icon: Gavel,
      href: "/dashboard/bids",
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      title: "Won Auctions",
      value: data.wonAuctionsCount,
      icon: Trophy,
      href: "/dashboard/bids",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Watchlist Items",
      value: data.watchlistCount,
      icon: Heart,
      href: "/dashboard/watchlist",
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div>
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your auction activity
        </p>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                    >
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-gray-500 sm:text-sm">
                        {stat.title}
                      </p>
                      <p className="text-xl font-bold text-gray-900 sm:text-2xl">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link href="/dashboard/listings/new">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <PlusCircle className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Create Listing
                </p>
                <p className="text-xs text-gray-500">List a truck for auction</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/auctions">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
                <Search className="h-5 w-5 text-navy-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Browse Auctions
                </p>
                <p className="text-xs text-gray-500">Find your next truck</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/watchlist">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <Eye className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  My Watchlist
                </p>
                <p className="text-xs text-gray-500">Trucks you're watching</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent bids */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gavel className="h-4 w-4 text-brand-600" />
              Recent Bids
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentBids.length === 0 ? (
              <div className="py-6 text-center">
                <Gavel className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">
                  No bids placed yet
                </p>
                <Link href="/auctions">
                  <Button variant="link" size="sm" className="mt-2">
                    Browse auctions
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentBids.map((bid) => {
                  const isWinning =
                    bid.listing.status === "ACTIVE" &&
                    bid.amount === bid.listing.currentHighBid;
                  return (
                    <Link
                      key={bid.id}
                      href={`/auctions/${bid.listing.slug || bid.listing.id}`}
                      className="block rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {bid.listing.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            Your bid: {formatPrice(bid.amount)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {bid.listing.status === "ACTIVE" && (
                            <Badge
                              variant={isWinning ? "success" : "danger"}
                              className="text-[10px]"
                            >
                              {isWinning ? "Winning" : "Outbid"}
                            </Badge>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {formatRelativeTime(bid.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent listing updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              My Listings Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentListingUpdates.length === 0 ? (
              <div className="py-6 text-center">
                <ClipboardList className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No listings yet</p>
                <Link href="/dashboard/listings/new">
                  <Button variant="link" size="sm" className="mt-2">
                    Create your first listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentListingUpdates.map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/auctions/${listing.slug || listing.id}`}
                    className="block rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {listing.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {listing.bidCount}{" "}
                          {listing.bidCount === 1 ? "bid" : "bids"}
                          {listing.currentHighBid > 0 &&
                            ` - High: ${formatPrice(listing.currentHighBid)}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            listing.status === "ACTIVE"
                              ? "success"
                              : listing.status === "DRAFT"
                                ? "default"
                                : listing.status === "SOLD"
                                  ? "brand"
                                  : "warning"
                          }
                          className="text-[10px]"
                        >
                          {listing.status}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(listing.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
