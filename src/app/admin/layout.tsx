import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard,
  FileText,
  Users,
  DollarSign,
  CheckCircle,
  Truck,
} from "lucide-react";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings?status=PENDING_REVIEW", label: "Pending Listings", icon: CheckCircle },
  { href: "/admin/listings", label: "All Listings", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/revenue", label: "Revenue", icon: DollarSign },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-navy-950 text-white">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-navy-800 px-6">
          <Truck className="h-6 w-6 text-brand-500" />
          <span className="text-lg font-bold tracking-tight">RigBid Admin</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {sidebarLinks.map((link) => (
            <SidebarLink key={link.href} {...link} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-navy-800 px-6 py-4">
          <p className="text-xs text-navy-400">
            Signed in as {session.user.name || session.user.email}
          </p>
          <Link
            href="/"
            className="mt-1 inline-block text-xs text-navy-400 hover:text-white transition-colors"
          >
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 bg-gray-50 p-8">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-navy-300 transition-colors hover:bg-navy-900 hover:text-white [&.active]:bg-brand-600 [&.active]:text-white"
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}
