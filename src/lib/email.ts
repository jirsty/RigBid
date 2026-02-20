import { Resend } from "resend";

// ─── Resend email client ─────────────────────────────────────────────────────
//
// When RESEND_API_KEY is missing the helpers log to the console instead of
// sending, so the app works without a Resend account in development.

const isResendConfigured = Boolean(process.env.RESEND_API_KEY);

const resend = isResendConfigured
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS =
  process.env.EMAIL_FROM || "RigBid <notifications@rigbid.com>";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Shared layout helpers ───────────────────────────────────────────────────

function layout(body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background-color:#0f172a;padding:24px 32px;">
            <span style="font-size:22px;font-weight:700;color:#ffffff;">Rig<span style="color:#f97316;">Bid</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 32px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;line-height:1.5;">
            <p style="margin:0;">You received this email because you have an account on RigBid.</p>
            <p style="margin:8px 0 0 0;">
              <a href="${BASE_URL}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Manage notification preferences</a>
              &nbsp;&middot;&nbsp;
              <a href="${BASE_URL}/unsubscribe" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();
}

function actionButton(href: string, label: string): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:#f97316;border-radius:6px;padding:12px 28px;">
      <a href="${href}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${label}</a>
    </td>
  </tr>
</table>`.trim();
}

function formatDollars(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

// ─── Send helper ─────────────────────────────────────────────────────────────

async function send(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    console.log(`[Email dev] To: ${options.to}`);
    console.log(`[Email dev] Subject: ${options.subject}`);
    console.log(`[Email dev] (HTML body omitted — ${options.html.length} chars)`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error("[Email] Failed to send:", error);
  }
}

// ─── Public helpers ──────────────────────────────────────────────────────────

/**
 * Notify a bidder they have been outbid on a listing.
 */
export async function sendOutbidEmail(
  userEmail: string,
  userName: string,
  listingTitle: string,
  currentBid: number,
  listingUrl: string
): Promise<void> {
  const subject = `You've been outbid on "${listingTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0;font-size:20px;color:#0f172a;">You've been outbid</h2>
    <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
      Hi ${userName}, someone placed a higher bid on <strong>${listingTitle}</strong>.
      The current high bid is now <strong>${formatDollars(currentBid)}</strong>.
    </p>
    <p style="margin:0 0 4px 0;color:#4b5563;font-size:14px;">
      Don't worry — you can still win. Place a new bid before the auction ends.
    </p>
    ${actionButton(listingUrl, "Place a New Bid")}
  `);

  await send({ to: userEmail, subject, html });
}

/**
 * Warn a user that an auction they are watching / bidding on ends within 1 hour.
 */
export async function sendAuctionEndingSoonEmail(
  userEmail: string,
  userName: string,
  listingTitle: string,
  listingUrl: string
): Promise<void> {
  const subject = `Ending soon: "${listingTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0;font-size:20px;color:#0f172a;">Auction ending soon</h2>
    <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
      Hi ${userName}, the auction for <strong>${listingTitle}</strong> ends in less than
      <strong>1 hour</strong>. If you want to win this truck, now is the time to act.
    </p>
    ${actionButton(listingUrl, "View Auction")}
  `);

  await send({ to: userEmail, subject, html });
}

/**
 * Congratulate the winning buyer.
 */
export async function sendAuctionWonEmail(
  buyerEmail: string,
  buyerName: string,
  listingTitle: string,
  winningBid: number,
  listingUrl: string
): Promise<void> {
  const subject = `Congratulations! You won "${listingTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0;font-size:20px;color:#0f172a;">You won the auction!</h2>
    <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
      Congratulations ${buyerName}! Your winning bid of
      <strong>${formatDollars(winningBid)}</strong> on <strong>${listingTitle}</strong>
      has been accepted.
    </p>
    <p style="margin:0 0 4px 0;color:#4b5563;font-size:14px;line-height:1.6;">
      A 5% buyer's premium will be added to the sale price. Complete payment through
      your dashboard to finalize the purchase and coordinate pickup or shipping.
    </p>
    ${actionButton(listingUrl, "Complete Purchase")}
  `);

  await send({ to: buyerEmail, subject, html });
}

/**
 * Notify the seller that their auction has ended.
 */
export async function sendAuctionEndedSellerEmail(
  sellerEmail: string,
  sellerName: string,
  listingTitle: string,
  finalPrice: number,
  sold: boolean
): Promise<void> {
  const subject = sold
    ? `Your truck sold: "${listingTitle}"`
    : `Auction ended: "${listingTitle}"`;

  const statusMessage = sold
    ? `<p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
        Great news, ${sellerName}! Your listing <strong>${listingTitle}</strong> sold
        for <strong>${formatDollars(finalPrice)}</strong>. The buyer will complete payment
        shortly and you will be notified when funds are available.
      </p>`
    : `<p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
        Hi ${sellerName}, the auction for <strong>${listingTitle}</strong> has ended.
        Unfortunately the reserve price was not met and the truck was not sold.
        You can relist the truck from your dashboard.
      </p>`;

  const html = layout(`
    <h2 style="margin:0 0 8px 0;font-size:20px;color:#0f172a;">
      ${sold ? "Your truck sold!" : "Auction ended"}
    </h2>
    ${statusMessage}
    ${actionButton(`${BASE_URL}/dashboard/listings`, "Go to Dashboard")}
  `);

  await send({ to: sellerEmail, subject, html });
}

/**
 * Confirm to a user that their bid was placed successfully.
 */
export async function sendBidConfirmationEmail(
  userEmail: string,
  userName: string,
  listingTitle: string,
  bidAmount: number,
  listingUrl: string
): Promise<void> {
  const subject = `Bid confirmed: ${formatDollars(bidAmount)} on "${listingTitle}"`;
  const html = layout(`
    <h2 style="margin:0 0 8px 0;font-size:20px;color:#0f172a;">Bid placed successfully</h2>
    <p style="margin:0 0 16px 0;color:#4b5563;font-size:14px;line-height:1.6;">
      Hi ${userName}, your bid of <strong>${formatDollars(bidAmount)}</strong> on
      <strong>${listingTitle}</strong> has been recorded. You are currently the
      highest bidder.
    </p>
    <p style="margin:0 0 4px 0;color:#4b5563;font-size:14px;line-height:1.6;">
      We'll notify you if someone outbids you so you can respond quickly.
    </p>
    ${actionButton(listingUrl, "View Auction")}
  `);

  await send({ to: userEmail, subject, html });
}
