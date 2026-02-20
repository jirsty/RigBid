"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Search,
  Menu,
  X,
  User,
  ChevronDown,
  Gavel,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Heart,
} from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-navy-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-brand-500" />
            <span className="text-xl font-bold text-white">
              Rig<span className="text-brand-500">Bid</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/auctions"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Browse Auctions
            </Link>
            <Link
              href="/results"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Auction Results
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              How It Works
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auctions">
              <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white hover:bg-navy-800">
                <Search className="h-5 w-5" />
              </Button>
            </Link>

            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {session.user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.user?.email}
                        </p>
                      </div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/watchlist"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart className="h-4 w-4" />
                        Watchlist
                      </Link>
                      <Link
                        href="/dashboard/listings/new"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <PlusCircle className="h-4 w-4" />
                        Sell a Truck
                      </Link>
                      <div className="border-t border-gray-100">
                        <button
                          onClick={() => signOut()}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-navy-800">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>List Your Truck</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-navy-800 pb-4 md:hidden">
            <div className="space-y-1 pt-4">
              <Link
                href="/auctions"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-navy-800 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Auctions
              </Link>
              <Link
                href="/results"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-navy-800 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Auction Results
              </Link>
              <Link
                href="/how-it-works"
                className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-navy-800 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
            </div>
            <div className="mt-4 border-t border-navy-800 pt-4">
              {session ? (
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-navy-800 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/listings/new"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-navy-800 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sell a Truck
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-base font-medium text-gray-300 hover:bg-navy-800 hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">List Your Truck</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
