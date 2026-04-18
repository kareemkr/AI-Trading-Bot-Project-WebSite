import { Toaster } from "sonner";
import { Providers } from "../components/providers";
import { GlobalAssistantBot } from "@/components/global-assistant-bot";
import "./globals.css";

export const metadata = {
  title: "Breakout OS - AI Backend Roadmap",
  description:
    "A polished AI and backend roadmap for building public proof, strong GitHub projects, and remote-ready software skills.",
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
