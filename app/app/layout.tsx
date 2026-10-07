import { createClient } from "@/lib/supabase/server";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";
import { redirect } from "next/navigation";
import SalesCaseProvider from './sales-case-provider';
import CaseToolFooter from './case-tool-footer';
import CaseLink from './case-link';

export default async function WebOSLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!(await hasWebOSAccess(supabase))) redirect("/activate");

  return (
    <SalesCaseProvider key={user.id} userId={user.id} navigation={
      <header className="global-app-header">
        <div className="global-app-header-inner">
          <CaseLink className="global-brand" href="/app" aria-label="BROS SELL Home">
            <img src="/bros-sell-logo.png" alt="BROS SELL™" />
            <span>
              <strong>BROS SELL™</strong>
              <small>Sales Operating System</small>
            </span>
          </CaseLink>
          <nav className="global-app-nav" aria-label="BROS SELL">
            <CaseLink className="nav-link" href="/app">Home</CaseLink>
            <CaseLink className="nav-link" href="/app/cases">Cases</CaseLink>
            <CaseLink className="nav-link" href="/app/resources">Library</CaseLink>
            <CaseLink className="nav-link" href="/app/account">Account</CaseLink>
            <a className="nav-link nav-link-muted" href="/auth/signout">Keluar</a>
          </nav>
        </div>
      </header>}>
      <div className="app-shell-content">{children}</div>
      <CaseToolFooter />
    </SalesCaseProvider>
  );
}
