import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Cormorant_Garamond } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LocaleProvider } from "@/components/providers/locale-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PwaRegister } from "@/components/providers/pwa-register";
import "./globals.css";

const bengali = Hind_Siliguri({
  variable: "--font-bengali",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rimi",
  description:
    "Ridika's private tracker for five daily prayers and Quran recitation.",
  applicationName: "Rimi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Rimi",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f4ea" },
    { media: "(prefers-color-scheme: dark)", color: "#071f18" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" suppressHydrationWarning className={`${bengali.variable} ${display.variable} h-full`}>
      <body className="min-h-full antialiased">
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              {children}
              <Toaster richColors position="top-center" />
              <PwaRegister />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
