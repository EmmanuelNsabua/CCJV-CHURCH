"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UserCheck, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepartmentNavTabsProps {
  className?: string;
}

export function DepartmentNavTabs({ className }: DepartmentNavTabsProps) {
  const pathname = usePathname();

  const isDepartmentsActive =
    pathname === "/admin/departments" ||
    (pathname.startsWith("/admin/departments/") &&
      !pathname.startsWith("/admin/departments/leaders") &&
      !pathname.startsWith("/admin/departments/community-faces"));

  const isLeadersActive = pathname.startsWith("/admin/departments/leaders");
  const isFacesActive = pathname.startsWith("/admin/departments/community-faces");

  const tabs = [
    {
      label: "Départements & Ministères",
      href: "/admin/departments",
      icon: Users,
      active: isDepartmentsActive,
    },
    {
      label: "Référentiel des Leaders",
      href: "/admin/departments/leaders",
      icon: UserCheck,
      active: isLeadersActive,
    },
    {
      label: "Visages de la communauté",
      href: "/admin/departments/community-faces",
      icon: HeartHandshake,
      active: isFacesActive,
    },
  ];

  return (
    <div
      className={cn(
        "border-b border-ccjv-line bg-white px-2 pt-1 mb-6 flex items-center gap-1 overflow-x-auto",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px whitespace-nowrap rounded-none",
              tab.active
                ? "border-ccjv-green text-ccjv-green bg-ccjv-green/5 font-semibold"
                : "border-transparent text-ccjv-ink-secondary hover:text-ccjv-ink hover:border-ccjv-line",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

