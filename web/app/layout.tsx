import type { ReactNode } from "react";

export const metadata = {
  title: "Adamas Campus Assistant",
  description: "Chat with the Adamas campus chatbot",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
