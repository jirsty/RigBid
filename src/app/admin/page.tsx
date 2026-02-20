import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice, formatNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  FileText,
  CheckCircle,
  DollarSign,
  ArrowRight,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const [
    totalUsers,
    activeListings,
    pendingReview,
    revenueResult,
    recentPending,
  ] = await Promise.all([
    db.user.count(),
    db.listing.count({ where: { status: "ACTIVE" } }),
    db.listing.count({ where: { status: "PENDING_REVIEW" } }),
    db.transaction.aggregate({
      _sum: { buyerPremiumAmount: true },
      where: { status: { in: ["PAID", "COMPLETED"] } },
    }),
    db.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        seller: { select: { id: true, name: true, email: true } },
        photos: { take: 1, orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  const totalRevenue = revenueResult._sum.buyerPremiumAmount ?? 0;

  const stats = [
    {
      label: "Total Users",
      value: formatNumber(totalUsers),
      icon: Users,
      color: "text-blue-600 bg-blue-100",
    },
    {
      label: "Active Listings",
      value: formatNumber(activeListings),
      icon: FileText,
      color: "text-green-600 bg-green-100",
    },
    {
      label: "Pending Review",
      value: formatNumber(pendingReview),
      icon: CheckCircle,
      color: "text-yellow-600 bg-yellow-100",
    },
    {
      label: "Total Revenue",
      value: formatPrice(totalRevenue),
      icon: DollarSign,
      color: "text-brand-600 bg-brand-100",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent pending listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pending Review</CardTitle>
          <Link
            href="/admin/listings?status=PENDING_REVIEW"
            className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {recentPending.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No listings pending review.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentPending.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/admin/listings/${listing.id}`}
                  className="flex items-center justify-between gap-4 py-4 transition-colors hover:bg-gray-50 -mx-6 px-6 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {listing.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      by {listing.seller.name || listing.seller.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-medium text-gray-900">
                        {formatPrice(listing.startingBid)}
                      </p>
                      <p className="text-xs text-gray-500">starting bid</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                    <Badge variant="warning">Review</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
