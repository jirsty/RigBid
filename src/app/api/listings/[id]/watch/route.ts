import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── POST /api/listings/[id]/watch — Add to watchlist ───────────────────────

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to watch a listing" },
        { status: 401 }
      );
    }

    const { id: listingId } = await params;

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

    // Check if already watching
    const existing = await db.watchlistItem.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ watching: true });
    }

    // Add to watchlist and increment watchCount
    await db.$transaction([
      db.watchlistItem.create({
        data: {
          userId: session.user.id,
          listingId,
        },
      }),
      db.listing.update({
        where: { id: listingId },
        data: { watchCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ watching: true });
  } catch (error) {
    console.error("[POST /api/listings/[id]/watch] Error:", error);
    return NextResponse.json(
      { error: "Failed to add to watchlist" },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/listings/[id]/watch — Remove from watchlist ────────────────

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to manage your watchlist" },
        { status: 401 }
      );
    }

    const { id: listingId } = await params;

    // Check if watching
    const existing = await db.watchlistItem.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ watching: false });
    }

    // Remove from watchlist and decrement watchCount
    await db.$transaction([
      db.watchlistItem.delete({
        where: {
          userId_listingId: {
            userId: session.user.id,
            listingId,
          },
        },
      }),
      db.listing.update({
        where: { id: listingId },
        data: { watchCount: { decrement: 1 } },
      }),
    ]);

    return NextResponse.json({ watching: false });
  } catch (error) {
    console.error("[DELETE /api/listings/[id]/watch] Error:", error);
    return NextResponse.json(
      { error: "Failed to remove from watchlist" },
      { status: 500 }
    );
  }
}
