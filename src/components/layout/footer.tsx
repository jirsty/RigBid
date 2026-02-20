import Link from "next/link";
import { Truck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-navy-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <Truck className="h-7 w-7 text-brand-500" />
              <span className="text-lg font-bold text-white">
                Rig<span className="text-brand-500">Bid</span>
              </span>
            </Link>
            <p className="mt-3 text-sm">
              The premier auction platform for semi trucks. Transparent pricing,
              verified sellers, and a community that knows trucks.
            </p>
          </div>

          {/* Auctions */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Auctions</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/auctions" className="hover:text-white transition-colors">
                  Browse All
                </Link>
              </li>
              <li>
                <Link href="/auctions?sort=ending" className="hover:text-white transition-colors">
                  Ending Soon
                </Link>
              </li>
              <li>
                <Link href="/results" className="hover:text-white transition-colors">
                  Auction Results
                </Link>
              </li>
              <li>
                <Link href="/dashboard/listings/new" className="hover:text-white transition-colors">
                  Sell a Truck
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/inspections" className="hover:text-white transition-colors">
                  Inspection Services
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-white">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-navy-800 pt-6 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} RigBid. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
