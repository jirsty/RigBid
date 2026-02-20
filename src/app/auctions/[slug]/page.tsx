import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Eye, Wrench, ShieldCheck, FileText, Calendar } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PhotoGallery } from "@/components/listings/photo-gallery";
import { BidSection } from "@/components/listings/bid-section";
import { CommentSection } from "@/components/listings/comment-section";
import { SpecSheet } from "@/components/listings/spec-sheet";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ slug: string }>;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getListing(slug: string) {
  const listing = await db.listing.findFirst({
    where: {
      OR: [{ slug }, { id: slug }],
    },
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
      bids: {
        orderBy: { amount: "desc" },
        select: {
          id: true,
          amount: true,
          createdAt: true,
          bidderId: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImageUrl: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        where: { parentId: null },
        orderBy: [{ isPinned: "desc" }, { createdAt: "asc" }],
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
    },
  });

  return listing;
}

// ─── SEO metadata ─────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    return { title: "Listing Not Found" };
  }

  const description = [
    `${listing.year} ${listing.make} ${listing.model}`,
    listing.mileage != null ? `${formatNumber(listing.mileage)} miles` : null,
    listing.engineMake && listing.engineModel
      ? `${listing.engineMake} ${listing.engineModel}`
      : null,
    listing.locationCity && listing.locationState
      ? `Located in ${listing.locationCity}, ${listing.locationState}`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  const imageUrl = listing.photos[0]?.url;

  return {
    title: listing.title,
    description,
    openGraph: {
      title: `${listing.title} | RigBid`,
      description,
      type: "website",
      ...(imageUrl && {
        images: [{ url: imageUrl, width: 1200, height: 630, alt: listing.title }],
      }),
    },
  };
}

// ─── Maintenance type labels ──────────────────────────────────────────────────

const MAINTENANCE_LABELS: Record<string, string> = {
  OIL_CHANGE: "Oil Change",
  TRANSMISSION_SERVICE: "Transmission Service",
  DPF_CLEAN_REGEN: "DPF Clean / Regen",
  INJECTOR_REPLACEMENT: "Injector Replacement",
  TURBO_SERVICE: "Turbo Service",
  EGR_SERVICE: "EGR Service",
  BRAKE_SERVICE: "Brake Service",
  TIRE_REPLACEMENT: "Tire Replacement",
  CLUTCH_REPLACEMENT: "Clutch Replacement",
  COOLANT_SERVICE: "Coolant Service",
  ECM_REPORT: "ECM Report",
  OIL_ANALYSIS: "Oil Analysis",
  OTHER: "Other",
};

const INSPECTION_RATING_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800",
  B: "bg-blue-100 text-blue-800",
  C: "bg-yellow-100 text-yellow-800",
  D: "bg-orange-100 text-orange-800",
  F: "bg-red-100 text-red-800",
};

const VERIFICATION_LABELS: Record<string, string> = {
  UNVERIFIED: "Unverified",
  VERIFIED_OWNER_OPERATOR: "Verified Owner-Operator",
  VERIFIED_DEALER: "Verified Dealer",
  FLEET_ACCOUNT: "Fleet Account",
};

// ─── Page component ───────────────────────────────────────────────────────────

export default async function AuctionDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const listing = await getListing(slug);

  if (!listing) {
    notFound();
  }

  const isEnded = listing.status === "ENDED" || listing.status === "SOLD";

  // Serialize dates for client components
  const serializedBids = listing.bids.map((bid) => ({
    ...bid,
    createdAt: bid.createdAt.toISOString(),
  }));

  const serializedComments = listing.comments.map((comment) => ({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    replies: comment.replies.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      replies: [] as Array<{
        id: string;
        body: string;
        isSellerResponse: boolean;
        isPinned: boolean;
        createdAt: string;
        updatedAt: string;
        user: { id: string; name: string | null; profileImageUrl: string | null };
        parentId: string | null;
        replies: never[];
      }>,
    })),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* ── Photo gallery (full width) ────────────────────────────────────── */}
      <PhotoGallery photos={listing.photos} title={listing.title} />

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Left column (wider) ───────────────────────────────────────── */}
        <div className="space-y-8 lg:col-span-2">
          {/* Title & meta */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {listing.listingTier === "FEATURED" && (
                <Badge variant="brand">Featured</Badge>
              )}
              {isEnded && (
                <Badge variant={listing.status === "SOLD" ? "success" : "default"}>
                  {listing.status === "SOLD" ? "Sold" : "Ended"}
                </Badge>
              )}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-navy-900 sm:text-3xl">
              {listing.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {listing.locationCity && listing.locationState && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {listing.locationCity}, {listing.locationState}
                </span>
              )}
              {listing.mileage != null && (
                <span>{formatNumber(listing.mileage)} miles</span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {formatNumber(listing.viewCount)} views
              </span>
            </div>
          </div>

          {/* ── Mobile: bid section between title and specs ───────────── */}
          <div className="lg:hidden">
            <BidSection
              listingId={listing.id}
              currentHighBid={listing.currentHighBid}
              startingBid={listing.startingBid}
              hasReserve={listing.hasReserve}
              reservePrice={listing.reservePrice}
              auctionEndTime={listing.auctionEndTime?.toISOString() ?? null}
              bidCount={listing.bidCount}
              bids={serializedBids}
              status={listing.status}
            />
          </div>

          {/* Seller info */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 text-navy-700">
              <span className="text-lg font-bold">
                {(listing.seller.name ?? "S")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {listing.seller.name ?? "Seller"}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    listing.seller.verificationStatus === "UNVERIFIED"
                      ? "default"
                      : "success"
                  }
                  className="text-[10px]"
                >
                  {VERIFICATION_LABELS[listing.seller.verificationStatus] ??
                    listing.seller.verificationStatus}
                </Badge>
                <span className="text-xs text-gray-400">
                  Member since{" "}
                  {listing.seller.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Description
              </h2>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {listing.description}
              </div>
            </div>
          )}

          {/* Spec sheet */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Specifications
            </h2>
            <SpecSheet listing={listing} />
          </div>

          {/* Maintenance records */}
          {listing.maintenanceRecords.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Wrench className="h-5 w-5 text-brand-600" />
                Maintenance Records
              </h2>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
                {listing.maintenanceRecords.map((record) => (
                  <div key={record.id} className="flex items-start gap-4 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      <Wrench className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {MAINTENANCE_LABELS[record.type] ?? record.type}
                        </span>
                        {record.shopName && (
                          <span className="text-xs text-gray-500">
                            at {record.shopName}
                          </span>
                        )}
                      </div>
                      {record.description && (
                        <p className="text-sm text-gray-600">
                          {record.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        {record.datePerformed && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {record.datePerformed.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        )}
                        {record.mileageAtService != null && (
                          <span>
                            {formatNumber(record.mileageAtService)} miles
                          </span>
                        )}
                      </div>
                    </div>
                    {record.documentUrl && (
                      <a
                        href={record.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-brand-600 hover:text-brand-700"
                        title="View document"
                      >
                        <FileText className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspections */}
          {listing.inspections.length > 0 && (
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
                Inspection Reports
              </h2>
              <div className="space-y-4">
                {listing.inspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="rounded-lg border border-gray-200 bg-white p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-medium text-gray-900">
                          {inspection.tier === "COMPREHENSIVE"
                            ? "Comprehensive Inspection"
                            : "Basic Inspection"}
                        </span>
                        {inspection.inspector && (
                          <span className="ml-2 text-sm text-gray-500">
                            by {inspection.inspector.shopName}
                            {inspection.inspector.city &&
                              `, ${inspection.inspector.city}, ${inspection.inspector.state}`}
                          </span>
                        )}
                      </div>
                      {inspection.overallRating && (
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${
                            INSPECTION_RATING_COLORS[inspection.overallRating] ??
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          Overall: {inspection.overallRating}
                        </span>
                      )}
                    </div>

                    {/* Score grid */}
                    {(inspection.engineScore ||
                      inspection.transmissionScore ||
                      inspection.frameScore ||
                      inspection.brakeScore ||
                      inspection.electricalScore ||
                      inspection.cabScore) && (
                      <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {(
                          [
                            ["Engine", inspection.engineScore],
                            ["Trans.", inspection.transmissionScore],
                            ["Frame", inspection.frameScore],
                            ["Brakes", inspection.brakeScore],
                            ["Electrical", inspection.electricalScore],
                            ["Cab", inspection.cabScore],
                          ] as [string, string | null][]
                        ).map(
                          ([label, score]) =>
                            score && (
                              <div
                                key={label}
                                className="rounded-md bg-gray-50 p-2 text-center"
                              >
                                <div className="text-xs text-gray-500">
                                  {label}
                                </div>
                                <div
                                  className={`mt-0.5 text-sm font-bold ${
                                    INSPECTION_RATING_COLORS[score]
                                      ?.split(" ")
                                      .find((c) => c.startsWith("text-")) ??
                                    "text-gray-800"
                                  }`}
                                >
                                  {score}
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    )}

                    {inspection.notes && (
                      <p className="text-sm text-gray-600">
                        {inspection.notes}
                      </p>
                    )}

                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      {inspection.completedAt && (
                        <span>
                          Completed{" "}
                          {inspection.completedAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                      {inspection.reportUrl && (
                        <a
                          href={inspection.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-medium text-brand-600 hover:text-brand-700"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          View Full Report
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <CommentSection
            listingId={listing.id}
            sellerId={listing.sellerId}
            comments={serializedComments}
          />
        </div>

        {/* ── Right sidebar (desktop only) ──────────────────────────────── */}
        <div className="hidden lg:block">
          <BidSection
            listingId={listing.id}
            currentHighBid={listing.currentHighBid}
            startingBid={listing.startingBid}
            hasReserve={listing.hasReserve}
            reservePrice={listing.reservePrice}
            auctionEndTime={listing.auctionEndTime?.toISOString() ?? null}
            bidCount={listing.bidCount}
            bids={serializedBids}
            status={listing.status}
          />
        </div>
      </div>
    </div>
  );
}
