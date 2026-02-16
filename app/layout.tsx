import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import FloatingActionButton from "./components/FloatingActionButton";
import { ThemeProvider } from "./components/ThemeProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lotus Care",
  description: "Sistema de gestão Lotus Care",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  return (
    <html lang="pt-BR" suppressHydrationWarning>
        <ThemeProvider>
        <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else if (!theme) {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (prefersDark) {
                      document.documentElement.classList.add('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {session && (
          <>
            <Sidebar />
            <FloatingActionButton />
          </>
        )}
        <main className="min-h-screen bg-[var(--background)] lg:ml-64">
          {children}
        </main>
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontSize: "14px",
            },
          }}
        />
      </body>
        </ThemeProvider>
    </html>
  );
}
