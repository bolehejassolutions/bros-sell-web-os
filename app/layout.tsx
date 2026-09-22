import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "BROS SELL™ — Closing OS",
  description: "BROS SELL™ Web OS"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ms"><body><div className="shell">{children}</div></body></html>;
}
