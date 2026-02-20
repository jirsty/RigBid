import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard,
  ClipboardList,
  Gavel,
  Heart,
  PlusCircle,
  Settings,
} from "lucide-react";
import { DashboardSidebarLink } from "./sidebar-link";

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard" as const,
  },
  {
    href: "/dashboard/listings",
    label: "My Listings",
    icon: "ClipboardList" as const,
  },
  {
    href: "/dashboard/bids",
    label: "My Bids",
    icon: "Gavel" as const,
  },
  {
    href: "/dashboard/watchlist",
    label: "Watchlist",
    icon: "Heart" as const,
  },
  {
    href: "/dashboard/listings/new",
    label: "Create Listing",
    icon: "PlusCircle" as const,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: "Settings" as const,
  },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-gray-200 bg-white pt-16 lg:block">
        <div className="flex h-full flex-col px-4 py-6">
          <div className="mb-6 px-3">
            <p className="text-sm font-medium text-gray-500">Welcome back,</p>
            <p className="truncate text-sm font-semibold text-gray-900">
              {session.user.name || session.user.email}
            </p>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarLinks.map((link) => (
              <DashboardSidebarLink
                key={link.href}
                href={link.href}
                label={link.label}
                icon={link.icon}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white lg:hidden">
        <div className="flex items-center justify-around py-2">
          <DashboardSidebarLink
            href="/dashboard"
            label="Home"
            icon="LayoutDashboard"
            mobile
          />
          <DashboardSidebarLink
            href="/dashboard/listings"
            label="Listings"
            icon="ClipboardList"
            mobile
          />
          <DashboardSidebarLink
            href="/dashboard/bids"
            label="Bids"
            icon="Gavel"
            mobile
          />
          <DashboardSidebarLink
            href="/dashboard/watchlist"
            label="Watch"
            icon="Heart"
            mobile
          />
          <DashboardSidebarLink
            href="/dashboard/settings"
            label="Settings"
            icon="Settings"
            mobile
          />
        </div>
      </nav>

      {/* Bottom spacing on mobile for nav bar */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}
