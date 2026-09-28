import "./globals.css";

export const metadata = {
  title: "Dynasty Sluts",
  description: "The home of Dynasty Sluts fantasy football.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}