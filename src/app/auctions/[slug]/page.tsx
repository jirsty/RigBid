import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { db } from "@/lib/db";
import { formatNumber } from "@/lib/utils";
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
    <div className="bg-white">
      {/* ── Photo gallery (full width, clean edge-to-edge feel) ──────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PhotoGallery photos={listing.photos} title={listing.title} />
      </div>

      {/* ── Title section ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          {listing.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          {listing.listingTier === "FEATURED" && (
            <span className="font-semibold text-brand-600">Featured</span>
          )}
          {isEnded && (
            <span className={listing.status === "SOLD" ? "font-semibold text-bat-green" : "font-semibold text-gray-500"}>
              {listing.status === "SOLD" ? "Sold" : "Ended"}
            </span>
          )}
          {(listing.listingTier === "FEATURED" || isEnded) && (
            <span className="text-gray-300">|</span>
          )}
          {listing.locationCity && listing.locationState && (
            <span>{listing.locationCity}, {listing.locationState}</span>
          )}
          {listing.mileage != null && (
            <>
              <span className="text-gray-300">&middot;</span>
              <span>{formatNumber(listing.mileage)} miles</span>
            </>
          )}
          <span className="text-gray-300">&middot;</span>
          <span>{formatNumber(listing.viewCount)} views</span>
        </div>
      </div>

      {/* ── Thin separator ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <hr className="border-gray-200" />
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* ── Left column (main content) ───────────────────────────────── */}
          <div className="space-y-10 lg:col-span-2">

            {/* ── Mobile: bid section between title and content ──────────── */}
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

            {/* ── Seller info (subtle, no card border) ───────────────────── */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <span className="text-sm font-semibold">
                  {(listing.seller.name ?? "S")[0].toUpperCase()}
                </span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {listing.seller.name ?? "Seller"}
                </span>
                <span className="mx-1.5 text-gray-300">&middot;</span>
                <span className="text-gray-500">
                  {VERIFICATION_LABELS[listing.seller.verificationStatus] ??
                    listing.seller.verificationStatus}
                </span>
                <span className="mx-1.5 text-gray-300">&middot;</span>
                <span className="text-gray-400">
                  Member since{" "}
                  {listing.seller.createdAt.toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>

            {/* ── Description ────────────────────────────────────────────── */}
            {listing.description && (
              <section>
                <h2 className="border-b border-gray-200 pb-2 text-xl font-bold text-gray-900">
                  Description
                </h2>
                <div className="mt-4 whitespace-pre-wrap text-base leading-7 text-gray-700">
                  {listing.description}
                </div>
              </section>
            )}

            {/* ── Specifications ─────────────────────────────────────────── */}
            <section>
              <h2 className="border-b border-gray-200 pb-2 text-xl font-bold text-gray-900">
                Specifications
              </h2>
              <div className="mt-4">
                <SpecSheet listing={listing} />
              </div>
            </section>

            {/* ── Maintenance records ────────────────────────────────────── */}
            {listing.maintenanceRecords.length > 0 && (
              <section>
                <h2 className="border-b border-gray-200 pb-2 text-xl font-bold text-gray-900">
                  Maintenance Records
                </h2>
                <div className="mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                        <th className="pb-2 pr-4">Service</th>
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Mileage</th>
                        <th className="pb-2 pr-4">Shop</th>
                        <th className="pb-2"><span className="sr-only">Document</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {listing.maintenanceRecords.map((record) => (
                        <tr key={record.id} className="text-gray-700">
                          <td className="py-3 pr-4">
                            <span className="font-medium text-gray-900">
                              {MAINTENANCE_LABELS[record.type] ?? record.type}
                            </span>
                            {record.description && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {record.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                            {record.datePerformed
                              ? record.datePerformed.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "\u2014"}
                          </td>
                          <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">
                            {record.mileageAtService != null
                              ? `${formatNumber(record.mileageAtService)} mi`
                              : "\u2014"}
                          </td>
                          <td className="py-3 pr-4 text-gray-500">
                            {record.shopName ?? "\u2014"}
                          </td>
                          <td className="py-3 text-right">
                            {record.documentUrl && (
                              <a
                                href={record.documentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-600 hover:text-brand-600/80"
                                title="View document"
                              >
                                <FileText className="inline h-4 w-4" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ── Inspections ────────────────────────────────────────────── */}
            {listing.inspections.length > 0 && (
              <section>
                <h2 className="border-b border-gray-200 pb-2 text-xl font-bold text-gray-900">
                  Inspection Reports
                </h2>
                <div className="mt-4 space-y-6">
                  {listing.inspections.map((inspection) => (
                    <div
                      key={inspection.id}
                      className="border-b border-gray-100 pb-6 last:border-b-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <span className="font-semibold text-gray-900">
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
                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-sm font-bold ${
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
                        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
                                  className="rounded bg-gray-50 px-3 py-2 text-center"
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
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                          {inspection.notes}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
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
                            className="font-medium text-brand-600 hover:text-brand-600/80"
                          >
                            View Full Report
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Comments ───────────────────────────────────────────────── */}
            <section>
              <CommentSection
                listingId={listing.id}
                sellerId={listing.sellerId}
                comments={serializedComments}
              />
            </section>
          </div>

          {/* ── Right sidebar (desktop only) ──────────────────────────────── */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
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
      </div>
    </div>
  );
}
