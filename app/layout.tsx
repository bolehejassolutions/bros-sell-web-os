import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "BROS SELL™ — Sales Operating System",
  description: "BROS SELL™ — Sales Operating System"
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="ms"><body><div className="shell">{children}</div></body></html>;
}
