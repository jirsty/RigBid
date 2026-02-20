import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Camera,
  CreditCard,
  Gavel,
  Truck,
  Banknote,
  Search,
  TrendingUp,
  Trophy,
  DollarSign,
  PackageCheck,
  ChevronDown,
  ArrowRight,
  Shield,
  Clock,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how to buy and sell semi trucks on RigBid. Simple, transparent auctions built for the trucking industry.",
};

// ─── Step data ───────────────────────────────────────────────────────────────

interface Step {
  number: number;
  title: string;
  description: string;
  icon: typeof UserPlus;
}

const sellerSteps: Step[] = [
  {
    number: 1,
    title: "Create Your Account",
    description:
      "Sign up for free and verify your identity. We review every seller to keep the marketplace trustworthy.",
    icon: UserPlus,
  },
  {
    number: 2,
    title: "List Your Truck",
    description:
      "Upload required photos (13 categories), enter detailed specs, mileage, VIN, and condition notes. Our team reviews every listing before it goes live.",
    icon: Camera,
  },
  {
    number: 3,
    title: "Pay the Listing Fee",
    description:
      "Standard listings are $99. Featured listings ($299) get priority placement and highlighted badges. One-time fee per listing.",
    icon: CreditCard,
  },
  {
    number: 4,
    title: "Auction Goes Live",
    description:
      "Your truck is listed for 7 days with real-time bidding. Buyers ask questions in the comments, and you can set an optional reserve price.",
    icon: Gavel,
  },
  {
    number: 5,
    title: "Truck Sells",
    description:
      "When the auction ends and the reserve is met (or there is no reserve), the highest bidder wins. We facilitate the transaction between buyer and seller.",
    icon: Truck,
  },
  {
    number: 6,
    title: "Get Paid via Stripe",
    description:
      "Payment is processed securely through Stripe. Funds are transferred to your connected Stripe account after the buyer completes payment.",
    icon: Banknote,
  },
];

const buyerSteps: Step[] = [
  {
    number: 1,
    title: "Browse Auctions",
    description:
      "Search and filter by make, model, year, mileage, and location. Every listing includes detailed photos, specs, and condition reports.",
    icon: Search,
  },
  {
    number: 2,
    title: "Place Bids in Real Time",
    description:
      "Bid on trucks you want. See all bids as they happen. Use auto-bid to set a maximum and let the system bid for you up to your limit.",
    icon: TrendingUp,
  },
  {
    number: 3,
    title: "Win the Auction",
    description:
      "When the 7-day auction ends, the highest bidder wins (if the reserve is met). Anti-sniping protection extends the clock if a bid comes in during the last 2 minutes.",
    icon: Trophy,
  },
  {
    number: 4,
    title: "Pay for the Truck",
    description:
      "Complete payment through your dashboard. The sale price plus a 5% buyer's premium (capped at $5,000) is collected via Stripe.",
    icon: DollarSign,
  },
  {
    number: 5,
    title: "Coordinate Pickup or Shipping",
    description:
      "Work directly with the seller to arrange pickup or hire a transport company. The listing shows the truck's location to help you plan.",
    icon: PackageCheck,
  },
];

// ─── FAQ data ────────────────────────────────────────────────────────────────

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "How much does it cost to list a truck?",
    answer:
      "Standard listings are $99 and featured listings are $299. This is a one-time fee per listing. There are no additional seller fees if your truck sells.",
  },
  {
    question: "What is the buyer's premium?",
    answer:
      "Buyers pay a 5% premium on top of the winning bid, capped at $5,000. For example, if you win a truck for $50,000, the premium is $2,500 for a total of $52,500.",
  },
  {
    question: "How long do auctions last?",
    answer:
      "All auctions run for 7 days. If a bid is placed in the final 2 minutes, the auction is automatically extended by 2 minutes to prevent sniping.",
  },
  {
    question: "What is a reserve price?",
    answer:
      "Sellers can set a hidden minimum price (reserve). If bidding doesn't reach the reserve, the truck is not sold. Reserve status is shown on the listing (met or not met) but the actual amount is not disclosed.",
  },
  {
    question: "Can I get the truck inspected before buying?",
    answer:
      "Yes. RigBid offers independent inspection services starting at $249. A certified inspector will examine the truck and provide a detailed report before you bid.",
  },
  {
    question: "How do payments work?",
    answer:
      "All payments are handled securely through Stripe. Buyers pay via credit card or ACH transfer. Sellers receive funds to their connected Stripe account after the buyer's payment clears.",
  },
  {
    question: "What happens if the buyer doesn't pay?",
    answer:
      "Buyers have 48 hours to complete payment after winning. If they fail to pay, the sale is voided and the seller can relist for free. Non-paying buyers may be suspended from the platform.",
  },
  {
    question: "Is there a warranty or guarantee?",
    answer:
      "RigBid is an auction marketplace — trucks are sold as-is. We strongly recommend requesting an inspection before bidding. Every listing includes detailed photos and condition disclosures.",
  },
  {
    question: "How do I contact support?",
    answer:
      "Email us at support@rigbid.com or use the contact form on the site. We typically respond within a few hours during business days.",
  },
];

// ─── Page component ──────────────────────────────────────────────────────────

function StepCard({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div className="flex gap-4">
      {/* Number circle + connector line */}
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {step.number}
        </div>
        <div className="mt-2 w-px flex-1 bg-gray-200" />
      </div>

      {/* Content */}
      <div className="pb-10">
        <div className="mb-1 flex items-center gap-2">
          <Icon className="h-5 w-5 text-brand-600" />
          <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          {step.description}
        </p>
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  return (
    <details className="group border-b border-gray-200 py-5 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer items-center justify-between text-left">
        <span className="text-sm font-semibold text-gray-900 sm:text-base">
          {faq.question}
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-gray-600">
        {faq.answer}
      </p>
    </details>
  );
}

export default function HowItWorksPage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-950 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              How <span className="text-brand-500">RigBid</span> Works
            </h1>
            <p className="mt-4 text-lg text-gray-300">
              Buy or sell semi trucks through transparent, time-limited auctions.
              No dealer markups, no mystery pricing — just a straightforward
              marketplace built for the trucking industry.
            </p>
          </div>
        </div>
      </section>

      {/* Trust highlights */}
      <section className="border-b border-gray-200 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Verified Listings
                </p>
                <p className="text-xs text-gray-500">
                  Every truck reviewed before going live
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Anti-Snipe Protection
                </p>
                <p className="text-xs text-gray-500">
                  Last-second bids extend the auction
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 shrink-0 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Secure Payments
                </p>
                <p className="text-xs text-gray-500">
                  All transactions through Stripe
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Sellers */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Heading */}
            <div>
              <span className="inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
                For Sellers
              </span>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                List your truck and reach thousands of buyers
              </h2>
              <p className="mt-3 text-gray-600">
                RigBid makes selling simple. Upload your photos, fill in the
                specs, and let the auction do the work. No negotiations, no
                tire-kickers — just qualified bids.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/listings/new">
                  <Button size="lg">
                    <Gavel className="mr-2 h-5 w-5" />
                    List Your Truck
                  </Button>
                </Link>
              </div>
            </div>

            {/* Steps */}
            <div>
              {sellerSteps.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Buyers */}
      <section className="border-t border-gray-200 bg-gray-50 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Steps — first on mobile, second on desktop */}
            <div className="order-2 lg:order-1">
              {buyerSteps.map((step) => (
                <StepCard key={step.number} step={step} />
              ))}
            </div>

            {/* Heading */}
            <div className="order-1 lg:order-2">
              <span className="inline-block rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700">
                For Buyers
              </span>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
                Find your next truck at auction prices
              </h2>
              <p className="mt-3 text-gray-600">
                Browse detailed listings with real photos, verified specs, and
                transparent bid history. Bid in real time, set auto-bids, and
                win the truck you want at a fair price.
              </p>
              <div className="mt-6">
                <Link href="/auctions">
                  <Button size="lg">
                    <Search className="mr-2 h-5 w-5" />
                    Browse Auctions
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <HelpCircle className="mx-auto h-8 w-8 text-brand-600" />
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-gray-600">
              Everything you need to know about buying and selling on RigBid.
            </p>
          </div>

          <div className="divide-y-0">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} faq={faq} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Join the premier auction platform for semi trucks. Sell for $99.
            Buy with confidence.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auctions">
              <Button
                size="lg"
                variant="outline"
                className="w-full border-gray-600 text-white hover:bg-navy-800 hover:text-white sm:w-auto"
              >
                Browse Auctions
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
