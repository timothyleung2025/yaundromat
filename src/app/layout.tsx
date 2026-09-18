import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./room-map.css";
import "./machine-list.css";
import "./liquid-glass.css";
export const metadata: Metadata = {
  applicationName: "Yaundromat",
  formatDetection: { telephone: false },
  title: "Yaundromat — Your room, in the loop",
  description:
    "A little less laundry guesswork. Find a machine, follow your load, and keep your shared laundry room in the loop.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Yaundromat",
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f3f6fc",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
