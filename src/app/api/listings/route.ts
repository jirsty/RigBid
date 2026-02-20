import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to create a listing" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // ─── Validate required fields ──────────────────────────────────────────────

    const { title, make, model, year } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!make || typeof make !== "string") {
      return NextResponse.json(
        { error: "Make is required" },
        { status: 400 }
      );
    }

    if (!model || typeof model !== "string" || model.trim().length === 0) {
      return NextResponse.json(
        { error: "Model is required" },
        { status: 400 }
      );
    }

    if (!year || typeof year !== "number" || year < 1970 || year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { error: "Valid year is required" },
        { status: 400 }
      );
    }

    if (
      !body.startingBid ||
      typeof body.startingBid !== "number" ||
      body.startingBid <= 0
    ) {
      return NextResponse.json(
        { error: "Starting bid must be greater than $0" },
        { status: 400 }
      );
    }

    // ─── Validate enums ────────────────────────────────────────────────────────

    const validTransmissions = ["MANUAL", "AUTO", "AUTOMATED_MANUAL"];
    const validAxles = ["SINGLE", "TANDEM", "TRI_AXLE"];
    const validSleepers = ["NONE", "MID_ROOF", "RAISED_ROOF", "FLAT_TOP", "CONDO"];
    const validFuel = ["DIESEL", "CNG", "ELECTRIC"];
    const validEmissions = ["PRE_EPA07", "EPA07", "EPA10", "EPA13", "EPA17_PLUS"];
    const validDriveTrains = ["FOUR_BY_TWO", "SIX_BY_FOUR", "SIX_BY_TWO"];
    const validPhotoCategories = [
      "EXTERIOR_FRONT", "EXTERIOR_REAR", "EXTERIOR_DRIVER_SIDE",
      "EXTERIOR_PASSENGER_SIDE", "ENGINE_BAY", "FRAME_RAILS", "FIFTH_WHEEL",
      "UNDERCARRIAGE", "CAB_INTERIOR", "DASHBOARD", "SLEEPER",
      "GAUGES_ODOMETER", "TIRES_FRONT", "TIRES_REAR", "DOT_STICKER",
      "DAMAGE_DOCUMENTATION", "MAINTENANCE_DOCS", "OTHER",
    ];
    const validMaintenanceTypes = [
      "OIL_CHANGE", "TRANSMISSION_SERVICE", "DPF_CLEAN_REGEN",
      "INJECTOR_REPLACEMENT", "TURBO_SERVICE", "EGR_SERVICE",
      "BRAKE_SERVICE", "TIRE_REPLACEMENT", "CLUTCH_REPLACEMENT",
      "COOLANT_SERVICE", "ECM_REPORT", "OIL_ANALYSIS", "OTHER",
    ];

    if (body.transmissionType && !validTransmissions.includes(body.transmissionType)) {
      return NextResponse.json(
        { error: "Invalid transmission type" },
        { status: 400 }
      );
    }

    if (body.axleConfiguration && !validAxles.includes(body.axleConfiguration)) {
      return NextResponse.json(
        { error: "Invalid axle configuration" },
        { status: 400 }
      );
    }

    if (body.sleeperType && !validSleepers.includes(body.sleeperType)) {
      return NextResponse.json(
        { error: "Invalid sleeper type" },
        { status: 400 }
      );
    }

    if (body.fuelType && !validFuel.includes(body.fuelType)) {
      return NextResponse.json(
        { error: "Invalid fuel type" },
        { status: 400 }
      );
    }

    if (body.emissionsStandard && !validEmissions.includes(body.emissionsStandard)) {
      return NextResponse.json(
        { error: "Invalid emissions standard" },
        { status: 400 }
      );
    }

    if (body.driveTrain && !validDriveTrains.includes(body.driveTrain)) {
      return NextResponse.json(
        { error: "Invalid drive train" },
        { status: 400 }
      );
    }

    // ─── Validate reserve and buy now logic ────────────────────────────────────

    const hasReserve = body.hasReserve === true;
    const reservePrice = hasReserve && typeof body.reservePrice === "number"
      ? body.reservePrice
      : null;

    if (hasReserve && (!reservePrice || reservePrice <= body.startingBid)) {
      return NextResponse.json(
        { error: "Reserve price must be greater than starting bid" },
        { status: 400 }
      );
    }

    const buyNowPrice = typeof body.buyNowPrice === "number" ? body.buyNowPrice : null;

    if (buyNowPrice && hasReserve && reservePrice && buyNowPrice <= reservePrice) {
      return NextResponse.json(
        { error: "Buy Now price must be greater than reserve price" },
        { status: 400 }
      );
    }

    // ─── Calculate auction end time ────────────────────────────────────────────

    const durationDays = typeof body.auctionDurationDays === "number"
      ? body.auctionDurationDays
      : 7;

    // Auction will start when the listing is approved, so we don't set start/end
    // times here. They will be set by the admin when the listing is approved.

    // ─── Build slug from title ─────────────────────────────────────────────────

    const baseSlug = `${year}-${make}-${model}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Add a random suffix for uniqueness
    const slugSuffix = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${slugSuffix}`;

    // ─── Create the listing ────────────────────────────────────────────────────

    const listing = await db.listing.create({
      data: {
        sellerId: session.user.id,
        status: "PENDING_REVIEW",
        slug,

        // Basic info
        title: title.trim(),
        make,
        model: model.trim(),
        year,
        vin: body.vin || null,
        mileage: typeof body.mileage === "number" ? body.mileage : null,
        locationCity: body.locationCity || null,
        locationState: body.locationState || null,
        locationZip: body.locationZip || null,

        // Specs
        engineMake: body.engineMake || null,
        engineModel: body.engineModel || null,
        engineHP: typeof body.engineHP === "number" ? body.engineHP : null,
        transmissionType: body.transmissionType || null,
        transmissionModel: body.transmissionModel || null,
        axleConfiguration: body.axleConfiguration || null,
        suspensionType: body.suspensionType || null,
        wheelbase: body.wheelbase || null,
        sleeperType: body.sleeperType || null,
        fifthWheelType: body.fifthWheelType || null,
        fuelType: body.fuelType || null,
        emissionsStandard: body.emissionsStandard || null,
        carbCompliant: body.carbCompliant === true,
        driveTrain: body.driveTrain || null,
        exteriorColor: body.exteriorColor || null,
        interiorCondition: body.interiorCondition || null,

        // Tires & Brakes
        tireCondition: body.tireCondition || null,
        tireBrand: body.tireBrand || null,
        tireSize: body.tireSize || null,
        brakeCondition: body.brakeCondition || null,

        // Emissions details
        dpfStatus: body.dpfStatus || null,
        egrStatus: body.egrStatus || null,
        aftertreatmentNotes: body.aftertreatmentNotes || null,

        // Description
        description: body.description || null,

        // Damage
        noDamage: body.noDamage !== false,

        // Auction settings
        startingBid: body.startingBid,
        hasReserve,
        reservePrice,
        buyNowPrice,
        listingTier: body.listingTier === "FEATURED" ? "FEATURED" : "STANDARD",

        // Photos (placeholder URLs for now -- real S3 upload comes later)
        photos: {
          create: Array.isArray(body.photos)
            ? body.photos
                .filter(
                  (p: { url: string; category: string; sortOrder: number }) =>
                    p.url && validPhotoCategories.includes(p.category)
                )
                .map(
                  (p: { url: string; category: string; sortOrder: number }, i: number) => ({
                    url: p.url,
                    category: p.category,
                    sortOrder: typeof p.sortOrder === "number" ? p.sortOrder : i,
                  })
                )
            : [],
        },

        // Maintenance records
        maintenanceRecords: {
          create: Array.isArray(body.maintenanceRecords)
            ? body.maintenanceRecords
                .filter(
                  (r: { type: string }) =>
                    r.type && validMaintenanceTypes.includes(r.type)
                )
                .map(
                  (r: {
                    type: string;
                    description: string | null;
                    mileageAtService: number | null;
                    datePerformed: string | null;
                    shopName: string | null;
                    documentUrl: string | null;
                  }) => ({
                    type: r.type,
                    description: r.description || null,
                    mileageAtService:
                      typeof r.mileageAtService === "number"
                        ? r.mileageAtService
                        : null,
                    datePerformed: r.datePerformed
                      ? new Date(r.datePerformed)
                      : null,
                    shopName: r.shopName || null,
                    documentUrl: r.documentUrl || null,
                  })
                )
            : [],
        },
      },
      include: {
        photos: true,
        maintenanceRecords: true,
      },
    });

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error("Error creating listing:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
