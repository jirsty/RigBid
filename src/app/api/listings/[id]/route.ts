import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── PATCH validation schema ────────────────────────────────────────────────

const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vin: z.string().max(17).optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  engineMake: z.string().optional().nullable(),
  engineModel: z.string().optional().nullable(),
  engineHP: z.number().int().min(0).optional().nullable(),
  transmissionType: z.enum(["MANUAL", "AUTO", "AUTOMATED_MANUAL"]).optional().nullable(),
  transmissionModel: z.string().optional().nullable(),
  axleConfiguration: z.enum(["SINGLE", "TANDEM", "TRI_AXLE"]).optional().nullable(),
  suspensionType: z.string().optional().nullable(),
  wheelbase: z.string().optional().nullable(),
  sleeperType: z.enum(["NONE", "MID_ROOF", "RAISED_ROOF", "FLAT_TOP", "CONDO"]).optional().nullable(),
  fifthWheelType: z.string().optional().nullable(),
  fuelType: z.enum(["DIESEL", "CNG", "ELECTRIC"]).optional().nullable(),
  emissionsStandard: z.enum(["PRE_EPA07", "EPA07", "EPA10", "EPA13", "EPA17_PLUS"]).optional().nullable(),
  carbCompliant: z.boolean().optional(),
  driveTrain: z.enum(["FOUR_BY_TWO", "SIX_BY_FOUR", "SIX_BY_TWO"]).optional().nullable(),
  exteriorColor: z.string().optional().nullable(),
  interiorCondition: z.string().optional().nullable(),
  tireCondition: z.string().optional().nullable(),
  tireBrand: z.string().optional().nullable(),
  tireSize: z.string().optional().nullable(),
  brakeCondition: z.string().optional().nullable(),
  dpfStatus: z.string().optional().nullable(),
  egrStatus: z.string().optional().nullable(),
  aftertreatmentNotes: z.string().optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  reservePrice: z.number().int().min(0).optional().nullable(),
  hasReserve: z.boolean().optional(),
  startingBid: z.number().int().min(0).optional(),
  auctionStartTime: z.string().datetime().optional().nullable(),
  auctionEndTime: z.string().datetime().optional().nullable(),
  buyNowPrice: z.number().int().min(0).optional().nullable(),
  listingTier: z.enum(["STANDARD", "FEATURED"]).optional(),
  locationCity: z.string().optional().nullable(),
  locationState: z.string().optional().nullable(),
  locationZip: z.string().optional().nullable(),
  noDamage: z.boolean().optional(),
});

// ─── GET /api/listings/[id] ─────────────────────────────────────────────────

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
            verificationStatus: true,
            createdAt: true,
          },
        },
        photos: {
          orderBy: { sortOrder: "asc" },
        },
        maintenanceRecords: {
          orderBy: { datePerformed: "desc" },
        },
        inspections: {
          where: { status: "COMPLETED" },
          include: {
            inspector: {
              select: {
                shopName: true,
                city: true,
                state: true,
              },
            },
          },
          orderBy: { completedAt: "desc" },
        },
        bids: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
                role: true,
              },
            },
            replies: {
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImageUrl: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Format bid names for privacy (first name + last initial)
    const formattedBids = listing.bids.map((bid) => {
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

    // Increment view count (fire and forget)
    db.listing
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        // Silently fail - view count is not critical
      });

    return NextResponse.json({
      listing: {
        ...listing,
        bids: formattedBids,
        // Never expose the exact reserve price to the public
        reservePrice: undefined,
        // Indicate whether reserve exists and if it's met
        hasReserve: listing.hasReserve,
        reserveMet:
          listing.hasReserve &&
          listing.reservePrice !== null &&
          listing.currentHighBid >= listing.reservePrice,
      },
    });
  } catch (error) {
    console.error("[GET /api/listings/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch listing" },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/listings/[id] ───────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to update a listing" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Fetch the listing
    const listing = await db.listing.findUnique({
      where: { id },
      select: {
        id: true,
        sellerId: true,
        status: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found" },
        { status: 404 }
      );
    }

    // Only the seller or an admin can update
    const isAdmin = session.user.role === "ADMIN";
    const isSeller = listing.sellerId === session.user.id;

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: "You do not have permission to update this listing" },
        { status: 403 }
      );
    }

    // Can only update DRAFT or PENDING_REVIEW listings
    if (listing.status !== "DRAFT" && listing.status !== "PENDING_REVIEW") {
      return NextResponse.json(
        {
          error: `Cannot update a listing with status "${listing.status}". Only DRAFT or PENDING_REVIEW listings can be edited.`,
        },
        { status: 400 }
      );
    }

    // Build update data, converting datetime strings to Date objects
    const updateData: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.auctionStartTime !== undefined) {
      updateData.auctionStartTime = parsed.data.auctionStartTime
        ? new Date(parsed.data.auctionStartTime)
        : null;
    }

    if (parsed.data.auctionEndTime !== undefined) {
      updateData.auctionEndTime = parsed.data.auctionEndTime
        ? new Date(parsed.data.auctionEndTime)
        : null;
    }

    const updatedListing = await db.listing.update({
      where: { id },
      data: updateData,
      include: {
        photos: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("[PATCH /api/listings/[id]] Error:", error);
    return NextResponse.json(
      { error: "Failed to update listing" },
      { status: 500 }
    );
  }
}
