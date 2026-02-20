"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Gavel,
  Heart,
  PlusCircle,
  Settings,
} from "lucide-react";

const iconMap = {
  LayoutDashboard,
  ClipboardList,
  Gavel,
  Heart,
  PlusCircle,
  Settings,
} as const;

type IconName = keyof typeof iconMap;

interface DashboardSidebarLinkProps {
  href: string;
  label: string;
  icon: IconName;
  mobile?: boolean;
}

export function DashboardSidebarLink({
  href,
  label,
  icon,
  mobile,
}: DashboardSidebarLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  const Icon = iconMap[icon];

  if (mobile) {
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
          isActive
            ? "text-brand-600"
            : "text-gray-500 hover:text-gray-700"
        )}
      >
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-50 text-brand-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 flex-shrink-0",
          isActive ? "text-brand-600" : "text-gray-400"
        )}
      />
      {label}
    </Link>
  );
}
