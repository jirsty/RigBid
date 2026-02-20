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
    <>
      {/* Thin red accent bar */}
      <div className="h-1 bg-brand-600" />

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Truck className="h-7 w-7 text-brand-600" />
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Rig<span className="text-brand-600">Bid</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-8 md:flex">
              <Link
                href="/auctions"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Auctions
              </Link>
              <Link
                href="/results"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                Results
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                How It Works
              </Link>
              <Link
                href="/dashboard/listings/new"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Sell a Truck
              </Link>
            </nav>

            {/* Right side */}
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/auctions">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {session.user?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5">
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
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 text-gray-400" />
                          Dashboard
                        </Link>
                        <Link
                          href="/dashboard/watchlist"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Heart className="h-4 w-4 text-gray-400" />
                          Watchlist
                        </Link>
                        <Link
                          href="/dashboard/listings/new"
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <PlusCircle className="h-4 w-4 text-gray-400" />
                          Sell a Truck
                        </Link>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={() => signOut()}
                            className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LogOut className="h-4 w-4 text-gray-400" />
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
                    <Button
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    >
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
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 md:hidden"
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
            <div className="border-t border-gray-100 pb-4 md:hidden">
              <div className="space-y-1 pt-3">
                <Link
                  href="/auctions"
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Auctions
                </Link>
                <Link
                  href="/results"
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Results
                </Link>
                <Link
                  href="/how-it-works"
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="/dashboard/listings/new"
                  className="block rounded-md px-3 py-2.5 text-base font-medium text-brand-600 hover:bg-brand-50 hover:text-brand-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sell a Truck
                </Link>
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                {session ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                        {session.user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {session.user?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/watchlist"
                      className="block rounded-md px-3 py-2.5 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Watchlist
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full rounded-md px-3 py-2.5 text-left text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 px-3">
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="outline" className="w-full">
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className="w-full">List Your Truck</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
