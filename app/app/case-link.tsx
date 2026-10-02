'use client';
import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useSalesCases } from './sales-case-provider';

export default function CaseLink(props: ComponentProps<typeof Link>) {
  const { active } = useSalesCases();
  let href = props.href;
  if (active && typeof href === 'string' && href.startsWith('/app')) {
    const parsed = new URL(href, 'https://local.invalid');
    if (!parsed.searchParams.has('case')) parsed.searchParams.set('case', active.id);
    href = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }
  return <Link {...props} href={href} />;
}
