"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Search,
  Menu,
  X,
  ChevronDown,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Heart,
} from "lucide-react";

function PersistentSearch({ className }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/auctions?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/auctions");
    }
    setQuery("");
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className ?? ""}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search auctions..."
        className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </form>
  );
}

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
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <Truck className="h-7 w-7 text-brand-600" />
              <span className="text-xl font-bold tracking-tight text-gray-900">
                BigRig<span className="text-brand-600">Bids</span>
              </span>
            </Link>

            {/* Persistent search bar - desktop: inline after logo */}
            <div className="hidden flex-1 md:flex">
              <PersistentSearch className="w-full max-w-xs lg:max-w-sm" />
            </div>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-6 md:flex">
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
                href="/dashboard/listings/new"
                className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700"
              >
                Sell a Truck
              </Link>
            </nav>

            {/* Right side actions */}
            <div className="hidden shrink-0 items-center gap-2 md:flex">
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
            <div className="ml-auto md:hidden">
              <button
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile search bar - always visible like BaT */}
          <div className="border-t border-gray-100 pb-2 pt-2 md:hidden">
            <PersistentSearch />
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
