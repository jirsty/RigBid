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
  Gavel,
  Trophy,
  ArrowUpRight,
  TrendingDown,
  Clock,
} from "lucide-react";
import { CountdownTimer } from "@/components/listings/countdown-timer";

interface BidWithListing {
  listingId: string;
  highestBid: number;
  listing: {
    id: string;
    slug: string | null;
    title: string;
    currentHighBid: number;
    status: string;
    auctionEndTime: Date | null;
    photos: {
      url: string;
      thumbnailUrl: string | null;
    }[];
  };
  isWinning: boolean;
  bidStatus: "winning" | "outbid" | "won" | "lost";
}

async function getUserBids(userId: string): Promise<BidWithListing[]> {
  // Get all listings the user has bid on, with their highest bid for each
  const bids = await db.bid.findMany({
    where: { bidderId: userId },
    include: {
      listing: {
        include: {
          photos: {
            take: 1,
            orderBy: { sortOrder: "asc" },
          },
          transaction: {
            select: { buyerId: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by listing and find user's highest bid
  const listingMap = new Map<string, BidWithListing>();

  for (const bid of bids) {
    const existing = listingMap.get(bid.listingId);
    if (!existing || bid.amount > existing.highestBid) {
      const isHighBidder = bid.listing.currentHighBid === bid.amount;
      const isActive = bid.listing.status === "ACTIVE";
      const isSold = bid.listing.status === "SOLD";
      const isEnded = bid.listing.status === "ENDED";
      const wonAuction = isSold && bid.listing.transaction?.buyerId === userId;

      let bidStatus: BidWithListing["bidStatus"];
      if (wonAuction) {
        bidStatus = "won";
      } else if ((isSold || isEnded) && !wonAuction) {
        bidStatus = "lost";
      } else if (isActive && isHighBidder) {
        bidStatus = "winning";
      } else {
        bidStatus = "outbid";
      }

      listingMap.set(bid.listingId, {
        listingId: bid.listingId,
        highestBid: bid.amount,
        listing: {
          id: bid.listing.id,
          slug: bid.listing.slug,
          title: bid.listing.title,
          currentHighBid: bid.listing.currentHighBid,
          status: bid.listing.status,
          auctionEndTime: bid.listing.auctionEndTime,
          photos: bid.listing.photos,
        },
        isWinning: isHighBidder,
        bidStatus,
      });
    }
  }

  // Sort: winning first, then outbid (active), then won, then lost
  const statusOrder: Record<string, number> = {
    winning: 0,
    outbid: 1,
    won: 2,
    lost: 3,
  };

  return Array.from(listingMap.values()).sort(
    (a, b) => statusOrder[a.bidStatus] - statusOrder[b.bidStatus]
  );
}

function getBidStatusConfig(status: BidWithListing["bidStatus"]) {
  switch (status) {
    case "winning":
      return {
        label: "Winning",
        variant: "success" as const,
        borderColor: "border-l-green-500",
        icon: TrendingDown,
      };
    case "outbid":
      return {
        label: "Outbid",
        variant: "danger" as const,
        borderColor: "border-l-red-500",
        icon: ArrowUpRight,
      };
    case "won":
      return {
        label: "Won",
        variant: "brand" as const,
        borderColor: "border-l-yellow-500",
        icon: Trophy,
      };
    case "lost":
      return {
        label: "Lost",
        variant: "default" as const,
        borderColor: "border-l-gray-300",
        icon: Clock,
      };
  }
}

export default async function BidsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userBids = await getUserBids(session.user.id);

  return (
    <div>
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bids</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track all the auctions you&apos;ve bid on
        </p>
      </div>

      {userBids.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Gavel className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No bids yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Start bidding on trucks to see your activity here.
            </p>
            <Link href="/auctions" className="mt-4 inline-block">
              <Button>Browse Auctions</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {userBids.map((bid) => {
            const config = getBidStatusConfig(bid.bidStatus);
            const imageUrl =
              bid.listing.photos[0]?.thumbnailUrl ||
              bid.listing.photos[0]?.url ||
              null;
            const endTime = bid.listing.auctionEndTime
              ? new Date(bid.listing.auctionEndTime)
              : null;

            return (
              <Link
                key={bid.listingId}
                href={`/auctions/${bid.listing.slug || bid.listing.id}`}
                className="block"
              >
                <Card
                  className={`overflow-hidden border-l-4 ${config.borderColor} transition-shadow hover:shadow-md`}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="relative h-28 w-full flex-shrink-0 bg-gray-100 sm:h-auto sm:w-36">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={bid.listing.title}
                            fill
                            className="object-cover"
                            sizes="144px"
                          />
                        ) : (
                          <div className="flex h-full min-h-[112px] items-center justify-center">
                            <Gavel className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex flex-1 items-center justify-between gap-4 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate text-sm font-semibold text-gray-900">
                              {bid.listing.title}
                            </h3>
                            <Badge
                              variant={config.variant}
                              className="flex-shrink-0"
                            >
                              {config.label}
                            </Badge>
                          </div>

                          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:flex sm:gap-x-6">
                            <div>
                              <span className="text-gray-500">Your Bid</span>
                              <p className="font-semibold text-gray-900">
                                {formatPrice(bid.highestBid)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                {bid.listing.status === "SOLD"
                                  ? "Sold For"
                                  : "Current High"}
                              </span>
                              <p
                                className={`font-semibold ${
                                  bid.bidStatus === "outbid"
                                    ? "text-red-600"
                                    : bid.bidStatus === "winning"
                                      ? "text-green-600"
                                      : bid.bidStatus === "won"
                                        ? "text-yellow-600"
                                        : "text-gray-900"
                                }`}
                              >
                                {formatPrice(bid.listing.currentHighBid)}
                              </p>
                            </div>
                            {bid.listing.status === "ACTIVE" && endTime && (
                              <div className="col-span-2 sm:col-span-1">
                                <span className="text-gray-500">
                                  Time Left
                                </span>
                                <div className="mt-0.5">
                                  <CountdownTimer
                                    endTime={endTime}
                                    compact
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <ArrowUpRight className="hidden h-5 w-5 flex-shrink-0 text-gray-400 sm:block" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
