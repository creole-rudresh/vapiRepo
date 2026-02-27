import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VAPI + Anam.ai | AI Voice Agent with Avatar Demo",
  description:
    "A demo integrating VAPI voice AI agent with Anam.ai real-time avatar for lifelike conversational AI experiences.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-[#0a0a0f] text-[#f0f0f5] bg-grid min-h-screen"
        style={{
          backgroundColor: "#0a0a0f",
          backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.08) 0%, transparent 60%), radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0)",
          backgroundSize: "100%, 40px 40px",
          color: "#f0f0f5"
        }}
      >
        {/* Floating ambient orbs */}
        <div
          className="floating-orb"
          style={{
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.12), transparent)",
            top: "-10%",
            right: "-5%",
          }}
        />
        <div
          className="floating-orb"
          style={{
            width: 300,
            height: 300,
            background:
              "radial-gradient(circle, rgba(139,92,246,0.08), transparent)",
            bottom: "10%",
            left: "-5%",
            animationDelay: "5s",
          }}
        />
        {children}
      </body>
    </html>
  );
}
