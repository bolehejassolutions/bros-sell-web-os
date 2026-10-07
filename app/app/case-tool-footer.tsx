'use client';
import { usePathname } from 'next/navigation';
import { useSalesCases } from './sales-case-provider';
import { CaseActionPanel, CaseDiagnosis } from './sales-case-workspace';

export default function CaseToolFooter() {
  const pathname = usePathname();
  const { active } = useSalesCases();
  if (!active || ['/app', '/app/resources', '/app/operator-dashboard'].includes(pathname)) return null;
  return <div className="container case-tool-footer"><CaseActionPanel key={active.id} /><CaseDiagnosis /></div>;
}
