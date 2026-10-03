'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { isCaseDocument, type CaseDocument, type JsonValue, type SalesCase } from '@/lib/bros-sell/sales-case';

import { readToolValue, writeToolValue } from '@/lib/bros-sell/case-tool-data';
import { createClient } from '@/lib/supabase/client';

type SaveState = 'saved' | 'draft' | 'saving' | 'error' | 'conflict';
type Store = {
  cases: SalesCase[]; active: SalesCase | undefined; loading: boolean; error: string;
  states: Record<string, SaveState>; messages: Record<string, string>;
  select: (id: string) => void; update: (change: (doc: CaseDocument) => CaseDocument) => void;
  create: (doc: CaseDocument) => Promise<void>; save: (id: string) => Promise<void>; reload: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
const fingerprint = (doc: CaseDocument) => JSON.stringify(doc);
export function useSalesCases() {
  const value = useContext(Context);
  if (!value) throw new Error('SalesCaseProvider is required');
  return value;
}

export default function SalesCaseProvider({ userId, navigation, children }: { userId: string; navigation?: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const query = useSearchParams();
  const router = useRouter();
  const queryId = query.get('case');
  const [cases, setCases] = useState<SalesCase[]>([]);
  const [activeId, setActiveId] = useState(queryId ?? '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(0);
  const [states, setStates] = useState<Record<string, SaveState>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const casesRef = useRef(cases);
  const saved = useRef(new Map<string, string>());
  const saving = useRef(new Set<string>());
  const failures = useRef(new Set<string>());
  const requestGeneration = useRef(0);
  useEffect(() => { casesRef.current = cases; }, [cases]);

  const reload = useCallback(async () => {
    const generation = ++requestGeneration.current;
    setError('');
    try {
      let page = 0;
      let total = 0;
      const rows: SalesCase[] = [];
      do {
        const response = await fetch(`/api/sales-cases?page=${page}`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
        const data = await response.json();
        if (!response.ok) { if ([401, 403].includes(response.status)) setBlocked(response.status); throw new Error(data.error); }
        if (!Array.isArray(data.cases) || !Number.isSafeInteger(data.total) || data.cases.some((row: SalesCase) => !isCaseDocument(row.document))) throw new Error('Data akaun tidak dapat dibaca.');
        rows.push(...data.cases);
        total = data.total;
        if (!data.cases.length && rows.length < total) throw new Error('Senarai case berubah. Cuba muat semula.');
        page++;
      } while (rows.length < total);
      if (generation !== requestGeneration.current) return;
      if (new Set(rows.map(row => row.id)).size !== rows.length) throw new Error('Senarai case berubah. Cuba muat semula.');
      saved.current = new Map(rows.map(row => [row.id, fingerprint(row.document)]));
      failures.current.clear();
      casesRef.current = rows;
      setCases(rows);
      setStates(Object.fromEntries(rows.map(row => [row.id, 'saved'])));
      setMessages({});
      setActiveId(current => rows.some(row => row.id === current) ? current : '');
    } catch (failure) { if (generation === requestGeneration.current) setError(failure instanceof Error ? failure.message : 'Simpanan akaun tidak dapat dihubungi.'); }
    finally { if (generation === requestGeneration.current) setLoading(false); }
  }, []);
  useEffect(() => { const requests = requestGeneration; void reload(); return () => { requests.current++; }; }, [reload, userId]);
  useEffect(() => {
    const client = createClient();
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (session && session.user.id !== userId)) {
        requestGeneration.current++;
        casesRef.current = [];
        saved.current.clear();
        setCases([]);
        setBlocked(401);
      }
    });
    return () => subscription.unsubscribe();
  }, [userId]);

  const active = cases.find(row => row.id === (queryId || activeId));
  const select = (id: string) => {
    setActiveId(id);
    const params = new URLSearchParams(query.toString());
    params.set('case', id);
    router.replace(`${pathname}?${params}`, { scroll: false });
  };
  const update = (change: (doc: CaseDocument) => CaseDocument) => {
    if (!active) return;
    const rows = casesRef.current.map(row => row.id === active.id ? { ...row, document: change(row.document) } : row);
    casesRef.current = rows;
    setCases(rows);
    setStates(previous => ({ ...previous, [active.id]: previous[active.id] === 'conflict' ? 'conflict' : 'draft' }));
    if (states[active.id] !== 'conflict') failures.current.delete(active.id);
  };
  const save = useCallback(async (id: string) => {
    const row = casesRef.current.find(value => value.id === id);
    if (!row || saving.current.has(id) || saved.current.get(id) === fingerprint(row.document)) return;
    if (!isCaseDocument(row.document)) {
      setStates(previous => ({ ...previous, [id]: 'draft' }));
      setMessages(previous => ({ ...previous, [id]: 'Lengkapkan tajuk, situasi dan bukti bagi signal yang disahkan sebelum menyimpan.' }));
      return;
    }
    saving.current.add(id);
    const sent = fingerprint(row.document);
    setStates(previous => ({ ...previous, [id]: 'saving' }));
    try {
      const response = await fetch(`/api/sales-cases/${id}`, { method: 'PUT', signal: AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: row.revision, document: row.document }) });
      const data = await response.json();
      if (!response.ok) {
        if ([401, 403].includes(response.status)) setBlocked(response.status);
        setStates(previous => ({ ...previous, [id]: response.status === 409 ? 'conflict' : 'error' }));
        throw new Error(data.error || 'Case belum disimpan.');
      }
      if (!data.case || !isCaseDocument(data.case.document)) throw new Error('Pengesahan simpanan tidak sah.');
      saved.current.set(id, fingerprint(data.case.document));
      const rows = casesRef.current.map(current => current.id === id ? { ...data.case, document: fingerprint(current.document) === sent ? data.case.document : current.document } : current);
      casesRef.current = rows;
      setCases(rows);
      setStates(previous => ({ ...previous, [id]: saved.current.get(id) === fingerprint(rows.find(current => current.id === id)!.document) ? 'saved' : 'draft' }));
      setMessages(previous => ({ ...previous, [id]: '' }));
      failures.current.delete(id);
    } catch (failure) {
      failures.current.add(id);
      setStates(previous => ({ ...previous, [id]: previous[id] === 'conflict' ? 'conflict' : 'error' }));
      setMessages(previous => ({ ...previous, [id]: failure instanceof Error ? failure.message : 'Case belum disimpan.' }));
    } finally { saving.current.delete(id); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      casesRef.current.filter(row => saved.current.get(row.id) !== fingerprint(row.document) && !failures.current.has(row.id)).forEach(row => { void save(row.id); });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [cases, save]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (casesRef.current.some(row => saved.current.get(row.id) !== fingerprint(row.document))) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);

  const create = async (document: CaseDocument) => {
    const response = await fetch('/api/sales-cases', { method: 'POST', signal: AbortSignal.timeout(20000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ document }) });
    const data = await response.json();
    if (!response.ok || !data.case) { if ([401, 403].includes(response.status)) setBlocked(response.status); throw new Error(data.error || 'Case belum disimpan.'); }
    saved.current.set(data.case.id, fingerprint(data.case.document));
    const rows = [data.case, ...casesRef.current];
    casesRef.current = rows;
    setCases(rows);
    setStates(previous => ({ ...previous, [data.case.id]: 'saved' }));
    select(data.case.id);
  };
  const toolPage = !['/app', '/app/resources', '/app/operator-dashboard'].includes(pathname);
  if (blocked) return <main className="container card case-notice" role="alert"><h1>{blocked === 401 ? 'Sesi telah tamat.' : 'Akses akaun perlu disemak.'}</h1><Link className="btn" href={blocked === 401 ? '/login' : '/activate'}>Semak akses</Link></main>;
  return <Context.Provider value={{ cases, active, loading, error, states, messages, select, update, create, save, reload }}>
    {navigation}
    <div className="container case-context">
      {loading ? <p role="status">Memuatkan Sales Cases...</p> : error ? <p role="alert">{error} <button className="btn secondary" onClick={() => void reload()}>Cuba lagi</button></p> : <>
        <label className="field-label"><span>Sales Case semasa</span><select className="input" value={active?.id ?? ''} onChange={event => select(event.target.value)}><option value="">Pilih case</option>{cases.map(row => <option key={row.id} value={row.id}>{row.document.example ? 'CONTOH · ' : ''}{row.document.title}{states[row.id] && states[row.id] !== 'saved' ? ' (belum disimpan)' : ''}</option>)}</select></label>
        <Link className="btn secondary" href="/app">Buka Analyzer / case baharu</Link>
        {active && <CaseSaveStatus />}
      </>}
    </div>
    {cases.some(row => ['error', 'conflict'].includes(states[row.id])) && <div className="container card" role="alert"><p>Ada case yang belum disimpan. Pilih case untuk semak draft dan cuba lagi.</p><div className="case-actions">{cases.filter(row => ['error', 'conflict'].includes(states[row.id])).map(row => <button className="btn secondary" key={row.id} onClick={() => select(row.id)}>{row.document.title}</button>)}</div></div>}
    {toolPage && !active ? <main className="container card"><h1>Pilih satu Sales Case dahulu.</h1><p>Input tools akan disimpan bersama case itu. Mulakan dengan situasi sebenar melalui Analyzer.</p><Link className="btn" href="/app">Buka Analyzer</Link></main> : children}
  </Context.Provider>;
}

export function CaseSaveStatus() {
  const { active, states, messages, save, reload } = useSalesCases();
  if (!active) return null;
  const status = states[active.id] ?? 'saved';
  const downloadDraft = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(active.document, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `sales-case-${active.id}.json`; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="case-save-status" role="status" aria-live="polite">
    <span>{({ saved: 'Disimpan dalam akaun', draft: 'Ada perubahan belum disimpan', saving: 'Sedang menyimpan...', error: 'Belum disimpan', conflict: 'Versi telah berubah' })[status]}</span>
    {messages[active.id] && <span>{messages[active.id]}</span>}
    {status !== 'saved' && <button className="btn secondary" disabled={status === 'saving' || status === 'conflict'} onClick={() => void save(active.id)}>Simpan</button>}
    {status !== 'saved' && <button className="btn secondary" onClick={downloadDraft}>Muat turun draft</button>}
    {status === 'conflict' && <button className="btn secondary" onClick={() => { if (window.confirm('Muat semula versi akaun? Perubahan yang belum disimpan akan diganti. Muat turun draft dahulu jika perlu.')) void reload(); }}>Muat semula versi akaun</button>}
  </div>;
}

export function useCaseToolState(tool: string, key: string, initial: string): [string, Dispatch<SetStateAction<string>>];
export function useCaseToolState(tool: string, key: string, initial: number): [number, Dispatch<SetStateAction<number>>];
export function useCaseToolState<T extends JsonValue>(tool: string, key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
export function useCaseToolState<T extends JsonValue>(tool: string, key: string, initial: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
  const { active, update } = useSalesCases();
  const [fallback, setFallback] = useState<T>(initial);
  const value = active ? readToolValue(active.document, tool, key, fallback) : fallback;
  const set: Dispatch<SetStateAction<T>> = action => {
    if (!active) { setFallback(action); return; }
    update(doc => {
      const previous = readToolValue(doc, tool, key, fallback);
      const next = typeof action === 'function' ? (action as (old: T) => T)(previous) : action;
      return writeToolValue(doc, tool, key, next, previous);
    });
  };
  return [value, set];
}
