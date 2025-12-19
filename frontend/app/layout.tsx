import { Toaster } from "sonner";
import { Providers } from "../components/providers";
import { GlobalAssistantBot } from "@/components/global-assistant-bot";
import "./globals.css";

export const metadata = {
  title: "NEURAL FLOW - Institutional AI Trading",
  description:
    "The world's most advanced AI-driven trading ecosystem. Execute data-backed strategies with institutional precision and secure automation.",
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
        <Providers>
            {children}
            <Toaster position="top-center" richColors />
            <GlobalAssistantBot />
        </Providers>
      </body>
    </html>
  );
}
