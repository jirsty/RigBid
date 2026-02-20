import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

export const metadata = {
  title: "Users - Admin",
};

const ROLE_BADGE_MAP: Record<
  string,
  "default" | "brand" | "success" | "warning" | "danger" | "navy"
> = {
  BUYER: "default",
  SELLER: "navy",
  ADMIN: "danger",
};

const VERIFICATION_BADGE_MAP: Record<
  string,
  "default" | "brand" | "success" | "warning" | "danger" | "navy"
> = {
  UNVERIFIED: "warning",
  VERIFIED_OWNER_OPERATOR: "success",
  VERIFIED_DEALER: "success",
  FLEET_ACCOUNT: "brand",
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() || "";

  const whereClause = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const users = await db.user.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { listings: true } },
    },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Users</h1>

      {/* Search */}
      <div className="mb-6">
        <form method="GET" action="/admin/users">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </form>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Users
            <span className="ml-2 text-base font-normal text-gray-500">
              ({users.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {query ? "No users match your search." : "No users found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Name
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Email
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Role
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Verification
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-right">
                      Listings
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {user.name || "--"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={ROLE_BADGE_MAP[user.role] || "default"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge
                          variant={
                            VERIFICATION_BADGE_MAP[user.verificationStatus] ||
                            "default"
                          }
                        >
                          {user.verificationStatus.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-gray-600">
                        {user._count.listings}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
