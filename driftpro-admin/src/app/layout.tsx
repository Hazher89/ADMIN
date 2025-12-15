import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import MicrosoftGraphBootstrapper from "@/components/MicrosoftGraphBootstrapper";
import AppShell from "@/components/AppShell";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "DriftPro Admin - Moderne Administrasjonssystem",
  description: "Den avanserte administrasjonsplattformen for moderne bedrifter. Administrer ansatte, skift, fravær, avvik og mye mer.",
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#4f46e5",
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" data-theme="dark" style={{ backgroundColor: '#0b1220', color: '#e5e7eb' }}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.style.backgroundColor = '#0b1220';
                  document.documentElement.style.color = '#e5e7eb';
                  document.body.style.backgroundColor = '#0b1220';
                  document.body.style.color = '#e5e7eb';
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} antialiased`}
        suppressHydrationWarning={true}
        style={{ backgroundColor: '#0b1220', color: '#e5e7eb' }}
      >
        <div className="min-h-screen flex flex-col">
          <AuthProvider>
            <MicrosoftGraphBootstrapper />
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
