
import "./globals.css";
import BottomNav from "./components/BottomNav";
import Link from "next/link";

export const metadata = {
  title: "Slootbowl Vault | SFL",
  description:
    "The historical and statistical archive of the Sluts Football League.",
  icons: {
    icon: "/logos/sfl-logo.PNG",
    apple: "/logos/sfl-logo.PNG",
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
        <header
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            padding: "24px 0 0",
          }}
        >
          <Link
            href="/"
            aria-label="SFL Home"
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              textDecoration: "none",
            }}
          >
            <img
              src="/logos/sfl-logo.PNG"
              alt="SFL League Logo"
              width={180}
              height={180}
              style={{
                display: "block",
                width: "min(46vw, 180px)",
                height: "auto",
                maxHeight: 180,
                objectFit: "contain",
              }}
            />
          </Link>
        </header>

        {children}

        <BottomNav />
      </body>
    </html>
  );
}
