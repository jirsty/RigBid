import Link from "next/link";
import { Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-navy-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Truck className="h-7 w-7 text-brand-500" />
              <span className="text-lg font-bold tracking-tight text-white">
                Rig<span className="text-brand-500">Bid</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              The premier auction platform for semi trucks. Transparent pricing,
              verified sellers, and a community that knows trucks.
            </p>
          </div>

          {/* Auctions */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
              Auctions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/auctions"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Browse All
                </Link>
              </li>
              <li>
                <Link
                  href="/auctions?sort=ending"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Ending Soon
                </Link>
              </li>
              <li>
                <Link
                  href="/results"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Auction Results
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/listings/new"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Sell a Truck
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
              Resources
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/inspections"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Inspection Services
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-300">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-navy-800 pt-8 text-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} RigBid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
