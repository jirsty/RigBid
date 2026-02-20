"use client";

import { useEffect, useState, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { BidUpdatePayload, AuctionEndPayload, AuctionExtendedPayload } from "@/lib/pusher-server";

export interface UseLiveBidsReturn {
  /** The most recently received bid update, or null if none yet. */
  latestBid: BidUpdatePayload | null;
  /** Whether the auction time was extended (anti-snipe). */
  auctionExtended: boolean;
  /** Whether the auction has ended via real-time event. */
  auctionEnded: boolean;
  /** The new end time after an anti-snipe extension, or null. */
  newEndTime: string | null;
  /** The auction end result payload, or null. */
  auctionResult: AuctionEndPayload | null;
}

/**
 * Subscribe to real-time bid updates for a specific listing.
 *
 * When Pusher is not configured (env vars missing) the hook returns
 * empty/default state and does nothing — no errors.
 */
export function useLiveBids(listingId: string): UseLiveBidsReturn {
  const [latestBid, setLatestBid] = useState<BidUpdatePayload | null>(null);
  const [auctionExtended, setAuctionExtended] = useState(false);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [newEndTime, setNewEndTime] = useState<string | null>(null);
  const [auctionResult, setAuctionResult] = useState<AuctionEndPayload | null>(null);

  const handleNewBid = useCallback((data: BidUpdatePayload) => {
    setLatestBid(data);
    // Reset the extension flag when a new bid comes in
    setAuctionExtended(false);
  }, []);

  const handleAuctionExtended = useCallback((data: AuctionExtendedPayload) => {
    setAuctionExtended(true);
    setNewEndTime(data.newEndTime);
  }, []);

  const handleAuctionEnded = useCallback((data: AuctionEndPayload) => {
    setAuctionEnded(true);
    setAuctionResult(data);
  }, []);

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher || !listingId) return;

    const channelName = `listing-${listingId}`;
    const channel = pusher.subscribe(channelName);

    channel.bind("new-bid", handleNewBid);
    channel.bind("auction-extended", handleAuctionExtended);
    channel.bind("auction-ended", handleAuctionEnded);

    return () => {
      channel.unbind("new-bid", handleNewBid);
      channel.unbind("auction-extended", handleAuctionExtended);
      channel.unbind("auction-ended", handleAuctionEnded);
      pusher.unsubscribe(channelName);
    };
  }, [listingId, handleNewBid, handleAuctionExtended, handleAuctionEnded]);

  return {
    latestBid,
    auctionExtended,
    auctionEnded,
    newEndTime,
    auctionResult,
  };
}
