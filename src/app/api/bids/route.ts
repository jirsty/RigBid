import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBidIncrement } from "@/lib/utils";
import { ANTI_SNIPE_WINDOW_MS, ANTI_SNIPE_EXTENSION_MS } from "@/lib/constants";

// ─── Rate limiting ───────────────────────────────────────────────────────────

const bidRateLimit = new Map<string, number>();
const RATE_LIMIT_MS = 5000; // 5 seconds

function checkRateLimit(userId: string, listingId: string): boolean {
  const key = `${userId}:${listingId}`;
  const lastBidTime = bidRateLimit.get(key);
  const now = Date.now();

  if (lastBidTime && now - lastBidTime < RATE_LIMIT_MS) {
    return false;
  }

  bidRateLimit.set(key, now);
  return true;
}

// Clean up stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of bidRateLimit.entries()) {
    if (now - timestamp > RATE_LIMIT_MS * 2) {
      bidRateLimit.delete(key);
    }
  }
}, 60_000);

// ─── Validation schema ──────────────────────────────────────────────────────

const bidSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  amount: z.number().int().positive("Bid amount must be positive"),
  isAutoBid: z.boolean().optional().default(false),
  maxAutoBidAmount: z.number().int().positive().optional(),
});

// ─── POST /api/bids ──────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to place a bid" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = bidSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { listingId, amount, isAutoBid, maxAutoBidAmount } = parsed.data;

    // Validate auto-bid max amount
    if (isAutoBid && (!maxAutoBidAmount || maxAutoBidAmount < amount)) {
      return NextResponse.json(
        { error: "Max auto-bid amount must be greater than or equal to bid amount" },
        { status: 400 }
      );
    }

    // Amount must be a whole dollar (divisible by 100 cents)
    if (amount % 100 !== 0) {
      return NextResponse.json(
        { error: "Bid amount must be a whole dollar amount" },
        { status: 400 }
      );
    }

    if (maxAutoBidAmount && maxAutoBidAmount % 100 !== 0) {
      return NextResponse.json(
        { error: "Max auto-bid amount must be a whole dollar amount" },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(session.user.id, listingId)) {
      return NextResponse.json(
        { error: "You are bidding too fast. Please wait a few seconds." },
        { status: 429 }
      );
    }

    // Fetch the listing
    const listing = await db.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Listing must be active
    if (listing.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This auction is not currently active" },
        { status: 400 }
      );
    }

    // Auction must not have ended
    if (!listing.auctionEndTime || new Date() > listing.auctionEndTime) {
      return NextResponse.json(
        { error: "This auction has ended" },
        { status: 400 }
      );
    }

    // Bidder cannot be the seller
    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot bid on your own listing" },
        { status: 400 }
      );
    }

    // If first bid, amount must be >= startingBid
    if (listing.bidCount === 0 && amount < listing.startingBid) {
      return NextResponse.json(
        { error: "Bid must be at least the starting bid amount" },
        { status: 400 }
      );
    }

    // If not first bid, amount must be >= currentHighBid + bidIncrement
    if (listing.bidCount > 0) {
      const increment = getBidIncrement(listing.currentHighBid);
      const minimumBid = listing.currentHighBid + increment;

      if (amount < minimumBid) {
        return NextResponse.json(
          {
            error: `Bid must be at least ${minimumBid} (current high bid + minimum increment)`,
          },
          { status: 400 }
        );
      }
    }

    // ─── Execute bid within a transaction ──────────────────────────────────

    const result = await db.$transaction(async (tx) => {
      // Re-check listing state inside the transaction for concurrency safety
      const freshListing = await tx.listing.findUnique({
        where: { id: listingId },
      });

      if (!freshListing || freshListing.status !== "ACTIVE") {
        throw new Error("Listing is no longer active");
      }

      if (freshListing.auctionEndTime && new Date() > freshListing.auctionEndTime) {
        throw new Error("Auction has ended");
      }

      // Re-check bid amount against fresh data
      if (freshListing.bidCount > 0) {
        const increment = getBidIncrement(freshListing.currentHighBid);
        if (amount < freshListing.currentHighBid + increment) {
          throw new Error("Another bid was placed. Please try again with a higher amount.");
        }
      }

      // Create the bid
      const bid = await tx.bid.create({
        data: {
          listingId,
          bidderId: session.user.id,
          amount,
          isAutoBid: isAutoBid ?? false,
          maxAutoBidAmount: isAutoBid ? maxAutoBidAmount : null,
        },
      });

      // Anti-sniping: extend auction if bid is within the snipe window
      let auctionExtended = false;
      let newEndTime: Date | null = null;

      if (freshListing.auctionEndTime) {
        const timeRemaining =
          freshListing.auctionEndTime.getTime() - Date.now();

        if (timeRemaining <= ANTI_SNIPE_WINDOW_MS && timeRemaining > 0) {
          newEndTime = new Date(
            freshListing.auctionEndTime.getTime() + ANTI_SNIPE_EXTENSION_MS
          );
          auctionExtended = true;
        }
      }

      // Update listing with new high bid and bid count
      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentHighBid: amount,
          bidCount: { increment: 1 },
          ...(auctionExtended && newEndTime
            ? { auctionEndTime: newEndTime }
            : {}),
        },
      });

      // ─── Auto-bid / proxy bid logic ────────────────────────────────────

      // Find existing auto-bids that can outbid this new bid
      const competingAutoBids = await tx.bid.findMany({
        where: {
          listingId,
          isAutoBid: true,
          bidderId: { not: session.user.id },
          maxAutoBidAmount: { gt: amount },
        },
        orderBy: { maxAutoBidAmount: "desc" },
      });

      let finalHighBid = amount;
      let finalBidCount = 1; // We already incremented by 1 above
      let autoBidPlaced: typeof bid | null = null;

      if (competingAutoBids.length > 0) {
        // The highest competing auto-bidder wins
        const topAutoBidder = competingAutoBids[0];
        const increment = getBidIncrement(amount);
        let autoBidAmount = amount + increment;

        // Cap at the auto-bidder's maximum
        if (autoBidAmount > topAutoBidder.maxAutoBidAmount!) {
          autoBidAmount = topAutoBidder.maxAutoBidAmount!;
        }

        // Ensure whole dollar
        autoBidAmount = Math.floor(autoBidAmount / 100) * 100;

        // Only place auto-bid if it actually exceeds the current bid
        if (autoBidAmount > amount) {
          autoBidPlaced = await tx.bid.create({
            data: {
              listingId,
              bidderId: topAutoBidder.bidderId,
              amount: autoBidAmount,
              isAutoBid: true,
              maxAutoBidAmount: topAutoBidder.maxAutoBidAmount,
            },
          });

          finalHighBid = autoBidAmount;
          finalBidCount = 2; // The auto-bid adds another

          // Check anti-sniping for the auto-bid too
          const currentEndTime = auctionExtended && newEndTime
            ? newEndTime
            : freshListing.auctionEndTime;

          if (currentEndTime) {
            const timeRemainingForAutoBid =
              currentEndTime.getTime() - Date.now();

            if (
              timeRemainingForAutoBid <= ANTI_SNIPE_WINDOW_MS &&
              timeRemainingForAutoBid > 0
            ) {
              newEndTime = new Date(
                currentEndTime.getTime() + ANTI_SNIPE_EXTENSION_MS
              );
              auctionExtended = true;
            }
          }

          // Update listing again with auto-bid result
          await tx.listing.update({
            where: { id: listingId },
            data: {
              currentHighBid: autoBidAmount,
              bidCount: { increment: 1 },
              ...(auctionExtended && newEndTime
                ? { auctionEndTime: newEndTime }
                : {}),
            },
          });
        }
      }

      // Check reserve
      const reserveMet =
        freshListing.hasReserve &&
        freshListing.reservePrice !== null &&
        finalHighBid >= freshListing.reservePrice;

      return {
        bid,
        autoBidPlaced,
        reserveMet: reserveMet ?? false,
        auctionExtended,
        newEndTime,
      };
    });

    return NextResponse.json({
      success: true,
      bid: result.bid,
      reserveMet: result.reserveMet,
      auctionExtended: result.auctionExtended,
      ...(result.auctionExtended && result.newEndTime
        ? { newEndTime: result.newEndTime.toISOString() }
        : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      // Known business logic errors from the transaction
      const knownErrors = [
        "Listing is no longer active",
        "Auction has ended",
        "Another bid was placed",
      ];

      if (knownErrors.some((msg) => error.message.includes(msg))) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("[POST /api/bids] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while placing your bid" },
      { status: 500 }
    );
  }
}
