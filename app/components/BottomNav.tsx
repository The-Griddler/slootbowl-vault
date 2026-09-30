"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname =
    usePathname();

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: "🏠",
    },
    {
      href: "/matchups",
      label: "Matchups",
      icon: "🏈",
    },
    {
      href: "/records",
      label: "Records",
      icon: "📊",
    },
    {
      href: "/history",
      label: "History",
      icon: "🏆",
    },
    {
      href: "/player-records",
      label: "Players",
      icon: "👤",
    },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "72px",
        background: "#11161d",
        borderTop:
          "1px solid #27303b",
        display: "flex",
        justifyContent:
          "space-around",
        alignItems: "center",
        zIndex: 100,
      }}
    >
      {navItems.map(
        (item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(
                  item.href
                );

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                textDecoration:
                  "none",
                color: active
                  ? "#ffffff"
                  : "#687384",
                display: "flex",
                flexDirection:
                  "column",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: "700",
                minWidth: "56px",
                minHeight: "52px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  lineHeight: 1,
                }}
              >
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>
            </Link>
          );
        }
      )}
    </nav>
  );
}