
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mainItems = [
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
    href: "/teams",
    label: "Teams",
    icon: "🛡️",
  },
  {
    href: "/records",
    label: "Records",
    icon: "📊",
  },
];

const moreItems = [
  {
    href: "/history",
    label: "League History",
    icon: "🏆",
    description: "Champions, awards and season archive",
  },
  {
    href: "/all-sloot",
    label: "All-Sloot Teams",
    icon: "🏅",
    description: "First Team, Second Team and Rookie Team honours",
  },
  {
    href: "/player-records",
    label: "Player Records",
    icon: "👤",
    description: "Individual player statistics and records",
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive =
    moreOpen ||
    moreItems.some(
      (item) =>
        pathname === item.href ||
        pathname.startsWith(item.href + "/")
    );

  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.65)",
              border: "none",
              zIndex: 98,
              cursor: "pointer",
            }}
          />

          <div
            style={{
              position: "fixed",
              bottom: "84px",
              left: "12px",
              right: "12px",
              maxWidth: "576px",
              margin: "0 auto",
              padding: "20px",
              background: "#151b23",
              border: "1px solid #27303b",
              borderRadius: "20px",
              zIndex: 99,
              boxShadow: "0 -8px 40px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#ffffff",
                }}
              >
                Explore
              </h2>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                style={{
                  border: "none",
                  background: "#27303b",
                  color: "#ffffff",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  fontSize: "18px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {moreItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMoreOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "16px",
                  marginBottom: "10px",
                  background: "#202833",
                  border: "1px solid #303b48",
                  borderRadius: "14px",
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </span>

                <div>
                  <p
                    style={{
                      color: "#ffffff",
                      fontWeight: "700",
                      fontSize: "15px",
                      marginBottom: "5px",
                    }}
                  >
                    {item.label}
                  </p>

                  <p
                    style={{
                      fontSize: "12px",
                      color: "#9da7b3",
                      lineHeight: "1.5",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "72px",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxSizing: "content-box",
          background: "#11161d",
          borderTop: "1px solid #27303b",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {mainItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href ||
                pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              style={{
                textDecoration: "none",
                color: active ? "#ffffff" : "#687384",
                display: "flex",
                flex: 1,
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: "700",
                minWidth: 0,
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

              <span>{item.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-label="More navigation options"
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            color: moreActive ? "#ffffff" : "#687384",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: "700",
            minWidth: 0,
            minHeight: "52px",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontSize: "20px",
              lineHeight: 1,
            }}
          >
            ☰
          </span>

          <span>More</span>
        </button>
      </nav>
    </>
  );
}
