import Pusher from "pusher";

// ─── Server-side Pusher client ───────────────────────────────────────────────
//
// Requires env vars: PUSHER_APP_ID, NEXT_PUBLIC_PUSHER_KEY,
//                    PUSHER_SECRET, NEXT_PUBLIC_PUSHER_CLUSTER
//
// If PUSHER_APP_ID is not set the helpers become no-ops so the app can run
// locally without a Pusher account.

const isPusherConfigured = Boolean(process.env.PUSHER_APP_ID);

export const pusherServer = isPusherConfigured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    })
  : null;

// ─── Bid data shape ──────────────────────────────────────────────────────────

export interface BidUpdatePayload {
  bidId: string;
  amount: number; // cents
  bidderName: string;
  bidCount: number;
  reserveMet: boolean;
  timestamp: string; // ISO string
}

export interface AuctionEndPayload {
  listingId: string;
  sold: boolean;
  finalPrice: number; // cents
  winnerName: string | null;
  timestamp: string;
}

export interface AuctionExtendedPayload {
  listingId: string;
  newEndTime: string; // ISO string
  reason: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Broadcast a new bid to all clients watching a listing.
 */
export async function triggerBidUpdate(
  listingId: string,
  bidData: BidUpdatePayload
): Promise<void> {
  if (!pusherServer) {
    console.log(
      `[Pusher no-op] triggerBidUpdate on listing-${listingId}`,
      bidData
    );
    return;
  }

  await pusherServer.trigger(`listing-${listingId}`, "new-bid", bidData);
}

/**
 * Notify clients that an auction's end time was extended (anti-snipe).
 */
export async function triggerAuctionExtended(
  listingId: string,
  data: AuctionExtendedPayload
): Promise<void> {
  if (!pusherServer) {
    console.log(
      `[Pusher no-op] triggerAuctionExtended on listing-${listingId}`,
      data
    );
    return;
  }

  await pusherServer.trigger(
    `listing-${listingId}`,
    "auction-extended",
    data
  );
}

/**
 * Notify clients that an auction has ended.
 */
export async function triggerAuctionEnd(
  listingId: string,
  result: AuctionEndPayload
): Promise<void> {
  if (!pusherServer) {
    console.log(
      `[Pusher no-op] triggerAuctionEnd on listing-${listingId}`,
      result
    );
    return;
  }

  await pusherServer.trigger(`listing-${listingId}`, "auction-ended", result);
}
