import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe as getStripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { calculateBuyerPremium } from "@/lib/utils";
import type Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("[STRIPE_WEBHOOK_SIGNATURE_ERROR]", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata) {
      console.error("[STRIPE_WEBHOOK] No metadata on session");
      return NextResponse.json({ received: true });
    }

    const { userId, listingId, type } = metadata;

    try {
      if (type === "listing_fee") {
        const tier = metadata.tier as "STANDARD" | "FEATURED";

        await db.listing.update({
          where: { id: listingId },
          data: {
            status: "PENDING_REVIEW",
            listingTier: tier,
          },
        });

        console.log(
          `[STRIPE_WEBHOOK] Listing ${listingId} updated to PENDING_REVIEW (${tier})`
        );
      }

      if (type === "buyer_premium") {
        const salePrice = parseInt(metadata.salePrice, 10);
        const buyerPremiumAmount = calculateBuyerPremium(salePrice);
        const totalAmount = salePrice + buyerPremiumAmount;

        const listing = await db.listing.findUnique({
          where: { id: listingId },
          select: { sellerId: true },
        });

        if (!listing) {
          console.error(
            `[STRIPE_WEBHOOK] Listing ${listingId} not found for buyer premium`
          );
          return NextResponse.json({ received: true });
        }

        await db.$transaction([
          db.transaction.create({
            data: {
              listingId,
              buyerId: userId,
              sellerId: listing.sellerId,
              salePrice,
              buyerPremiumAmount,
              totalAmount,
              stripePaymentIntentId: session.payment_intent as string,
              status: "PAID",
            },
          }),
          db.listing.update({
            where: { id: listingId },
            data: { status: "SOLD" },
          }),
        ]);

        console.log(
          `[STRIPE_WEBHOOK] Transaction created for listing ${listingId}, status set to SOLD`
        );
      }
    } catch (error) {
      console.error("[STRIPE_WEBHOOK_PROCESSING_ERROR]", error);
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
