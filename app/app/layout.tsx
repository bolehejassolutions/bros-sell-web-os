import { createClient } from "@/lib/supabase/server";
import { claimPaidBrosSellOrders, hasWebOSAccess } from "@/lib/supabase/entitlement";
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

  if (!(await hasWebOSAccess(supabase))) {
    await claimPaidBrosSellOrders(supabase);
    if (!(await hasWebOSAccess(supabase))) redirect("/activate");
  }

  return (
    <SalesCaseProvider key={user.id} userId={user.id} navigation={
      <header className="global-app-header">
        <div className="global-app-header-inner">
          <CaseLink className="global-brand" href="/app" aria-label="BROS SELL Customer Hub">
            <img src="/bros-sell-logo.png" alt="BROS SELL™" />
            <span>
              <strong>BROS SELL™</strong>
              <small>Web OS</small>
            </span>
          </CaseLink>
          <nav className="global-app-nav" aria-label="Web OS">
            <CaseLink className="btn secondary" href="/app">Analyzer</CaseLink>
            <CaseLink className="btn secondary" href="/app/operator-dashboard">Operasi</CaseLink>
            <CaseLink className="btn secondary" href="/app/resources">Resources</CaseLink>
            <a className="btn secondary" href="/auth/signout">Keluar</a>
          </nav>
        </div>
      </header>}>
      <div className="app-shell-content">{children}</div>
      <CaseToolFooter />
    </SalesCaseProvider>
  );
}
