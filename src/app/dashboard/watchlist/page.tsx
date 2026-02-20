import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/listing-card";
import { Heart, Search } from "lucide-react";

async function getWatchlistItems(userId: string) {
  const watchlistItems = await db.watchlistItem.findMany({
    where: { userId },
    include: {
      listing: {
        include: {
          photos: {
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return watchlistItems.map((item) => item.listing);
}

export default async function WatchlistPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const listings = await getWatchlistItems(session.user.id);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
        <p className="mt-1 text-sm text-gray-500">
          Trucks you&apos;re keeping an eye on
        </p>
      </div>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Your watchlist is empty
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
              Browse auctions and click the heart icon to add trucks to your
              watchlist. You&apos;ll be able to track them all here.
            </p>
            <Link href="/auctions" className="mt-4 inline-block">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Auctions
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">
            {listings.length} {listings.length === 1 ? "truck" : "trucks"} in
            your watchlist
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
