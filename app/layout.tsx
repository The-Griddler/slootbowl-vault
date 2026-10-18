
import "./globals.css";
import BottomNav from "./components/BottomNav";
import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Slootbowl Vault | SFL",
  description:
    "The official historical and statistical archive of the Sluts Football League.",
  icons: {
    icon: "/sfl-logo.PNG",
    apple: "/sfl-logo.PNG",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Site-wide SFL masthead */}
        <header
          style={{
            background: "#10151c",
            borderBottom: "1px solid #29313d",
            width: "100%",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 13,
              padding: "12px 18px",
              maxWidth: 1100,
              margin: "0 auto",
              textDecoration: "none",
              color: "#ffffff",
            }}
          >
            <Image
              src="/sfl-logo.PNG"
              alt="SFL league logo"
              width={58}
              height={58}
              priority
              style={{
                objectFit: "contain",
                width: 58,
                height: 58,
                flexShrink: 0,
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  color: "#eab308",
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: 2,
                }}
              >
                SFL
              </span>

              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  lineHeight: 1.1,
                }}
              >
                SLOOTBOWL VAULT
              </span>

              <span
                style={{
                  color: "#9da7b3",
                  fontSize: 10,
                  letterSpacing: 0.4,
                }}
              >
                THE LEAGUE. THE LEGACY.
              </span>
            </div>
          </Link>
        </header>

        {/* Existing website pages */}
        {children}

        {/* Existing bottom navigation */}
        <BottomNav />
      </body>
    </html>
  );
}
