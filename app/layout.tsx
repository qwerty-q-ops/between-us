import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Between Us — understand each other",
  description: "A private, thoughtful space for two people to understand each other better."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
