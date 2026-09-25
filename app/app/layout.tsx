import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";

export default async function WebOSLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await hasWebOSAccess())) redirect("/activate");

  return (
    <>
      <header className="global-app-header">
        <div className="global-app-header-inner">
          <a className="global-brand" href="/app" aria-label="BROS SELL Customer Hub">
            <img src="/bros-sell-logo.png" alt="BROS SELL™" />
            <span>
              <strong>BROS SELL™</strong>
              <small>Web OS</small>
            </span>
          </a>
          <nav className="global-app-nav" aria-label="Web OS">
            <a className="btn secondary" href="/app">Hub</a>
            <a className="btn secondary" href="/app/resources">Resources</a>
            <a className="btn secondary" href="/auth/signout">Keluar</a>
          </nav>
        </div>
      </header>
      <div className="app-shell-content">{children}</div>
    </>
  );
}
