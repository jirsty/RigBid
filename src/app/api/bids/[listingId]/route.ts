import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── GET /api/bids/[listingId] ───────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const { listingId } = await params;

    // Verify the listing exists
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Fetch all bids for the listing, ordered by most recent first
    const bids = await db.bid.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      include: {
        bidder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Format bidder names for privacy: first name + last initial
    const formattedBids = bids.map((bid) => {
      let displayName = "Anonymous";

      if (bid.bidder.name) {
        const parts = bid.bidder.name.trim().split(/\s+/);
        if (parts.length >= 2) {
          displayName = `${parts[0]} ${parts[parts.length - 1][0]}.`;
        } else {
          displayName = parts[0];
        }
      }

      return {
        id: bid.id,
        amount: bid.amount,
        isAutoBid: bid.isAutoBid,
        bidderName: displayName,
        bidderId: bid.bidder.id,
        createdAt: bid.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ bids: formattedBids });
  } catch (error) {
    console.error("[GET /api/bids/[listingId]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bids" },
      { status: 500 }
    );
  }
}
