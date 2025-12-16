import { Toaster } from "sonner";
import "./globals.css";

export const metadata = {
  title: "KRO - AI Trading Assistant",
  description:
    "The fastest and secure AI trading assistant. Trade faster and smarter with our secure AI bots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased"
      >
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
