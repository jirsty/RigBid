import Stripe from "stripe";
import { LISTING_FEE_STANDARD, LISTING_FEE_FEATURED } from "@/lib/constants";
import { calculateBuyerPremium } from "@/lib/utils";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, {
    apiVersion: "2026-01-28.clover",
  });
}

export { getStripe as stripe };

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function createListingFeeCheckout(
  userId: string,
  listingId: string,
  tier: "STANDARD" | "FEATURED"
) {
  const stripe = getStripe();
  const amount = tier === "FEATURED" ? LISTING_FEE_FEATURED : LISTING_FEE_STANDARD;
  const tierLabel = tier === "FEATURED" ? "Featured Listing" : "Standard Listing";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `RigBid ${tierLabel} Fee`,
            description:
              tier === "FEATURED"
                ? "Priority placement and highlighted in search results"
                : "Standard auction listing on RigBid",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      listingId,
      type: "listing_fee",
      tier,
    },
    success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/payment/cancel`,
  });

  return session;
}

export async function createBuyerPremiumCheckout(
  userId: string,
  listingId: string,
  salePrice: number
) {
  const stripe = getStripe();
  const premiumAmount = calculateBuyerPremium(salePrice);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "RigBid Buyer Premium",
            description: "5% buyer premium (capped at $5,000)",
          },
          unit_amount: premiumAmount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      listingId,
      type: "buyer_premium",
      salePrice: salePrice.toString(),
    },
    success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${BASE_URL}/payment/cancel`,
  });

  return session;
}
