import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createListingFeeCheckout,
  createBuyerPremiumCheckout,
} from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, type, tier } = body as {
      listingId: string;
      type: "listing_fee" | "buyer_premium";
      tier?: "STANDARD" | "FEATURED";
    };

    if (!listingId || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (type === "listing_fee") {
      if (!tier || (tier !== "STANDARD" && tier !== "FEATURED")) {
        return NextResponse.json(
          { error: "Invalid tier. Must be STANDARD or FEATURED" },
          { status: 400 }
        );
      }

      const listing = await db.listing.findUnique({
        where: { id: listingId },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }

      if (listing.sellerId !== session.user.id) {
        return NextResponse.json(
          { error: "You do not own this listing" },
          { status: 403 }
        );
      }

      if (listing.status !== "DRAFT" && listing.status !== "PENDING_REVIEW") {
        return NextResponse.json(
          { error: "Listing is not in a payable status" },
          { status: 400 }
        );
      }

      const checkoutSession = await createListingFeeCheckout(
        session.user.id,
        listingId,
        tier
      );

      return NextResponse.json({ url: checkoutSession.url });
    }

    if (type === "buyer_premium") {
      const listing = await db.listing.findUnique({
        where: { id: listingId },
        include: {
          bids: {
            orderBy: { amount: "desc" },
            take: 1,
          },
        },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Listing not found" },
          { status: 404 }
        );
      }

      if (listing.status !== "ENDED") {
        return NextResponse.json(
          { error: "Auction has not ended" },
          { status: 400 }
        );
      }

      const winningBid = listing.bids[0];

      if (!winningBid || winningBid.bidderId !== session.user.id) {
        return NextResponse.json(
          { error: "You did not win this auction" },
          { status: 403 }
        );
      }

      const checkoutSession = await createBuyerPremiumCheckout(
        session.user.id,
        listingId,
        winningBid.amount
      );

      return NextResponse.json({ url: checkoutSession.url });
    }

    return NextResponse.json(
      { error: "Invalid payment type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[STRIPE_CHECKOUT_ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
