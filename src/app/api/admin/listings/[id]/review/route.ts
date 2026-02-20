import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_AUCTION_DURATION_DAYS } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (
    !session?.user ||
    (session.user as { role?: string }).role !== "ADMIN"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const { action, reason } = body as {
    action: "approve" | "reject";
    reason?: string;
  };

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action. Must be 'approve' or 'reject'." },
      { status: 400 }
    );
  }

  const listing = await db.listing.findUnique({
    where: { id },
  });

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (listing.status !== "PENDING_REVIEW") {
    return NextResponse.json(
      { error: "Listing is not pending review." },
      { status: 400 }
    );
  }

  if (action === "approve") {
    const now = new Date();
    const endTime = new Date(
      now.getTime() + DEFAULT_AUCTION_DURATION_DAYS * 24 * 60 * 60 * 1000
    );

    const updatedListing = await db.listing.update({
      where: { id },
      data: {
        status: "ACTIVE",
        auctionStartTime: now,
        auctionEndTime: endTime,
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  }

  // Reject
  if (!reason?.trim()) {
    return NextResponse.json(
      { error: "Rejection reason is required." },
      { status: 400 }
    );
  }

  const updatedListing = await db.listing.update({
    where: { id },
    data: {
      status: "CANCELLED",
    },
  });

  return NextResponse.json({
    success: true,
    listing: updatedListing,
  });
}
