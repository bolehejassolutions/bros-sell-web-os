'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isCaseDocument, type SalesCase } from '@/lib/bros-sell/sales-case';

type Summary = { synced: number; pending: number; conflict: number };
type Vault = {
  account: string;
  all: () => Promise<Array<SalesCase & { dirty: boolean; conflict: boolean }>>;
  mergeRemote: (rows: SalesCase[]) => Promise<{ updated: number; retained: number }>;
  sync: () => Promise<Summary>;
  clear: () => Promise<void>;
};
type OfflineApi = {
  accounts: () => Promise<Array<{ id: string; created: string }>>;
  create: (id: string, phrase: string) => Promise<Vault>;
  unlock: (id: string, phrase: string) => Promise<Vault>;
  removeAccount: (id: string) => Promise<void>;
};
declare global {
  interface Window { BrosSellOfflineStore?: OfflineApi; }
}
function loadOfflineApi(): Promise<OfflineApi> {
  if (window.BrosSellOfflineStore) return Promise.resolve(window.BrosSellOfflineStore);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/offline-store.js';
    script.async = true;
    script.onload = () => window.BrosSellOfflineStore
      ? resolve(window.BrosSellOfflineStore) : reject(new Error('Penyimpanan offline tidak tersedia.'));
    script.onerror = () => reject(new Error('Fail offline gagal dimuatkan.'));
    document.head.appendChild(script);
  });
}
async function getOnlineCases(expectedUserId: string): Promise<SalesCase[]> {
  const identity = await fetch('/api/offline/identity', { cache: 'no-store' });
  if (!identity.ok) throw new Error('Sahkan login dan akses Web OS sebelum menyalin case.');
  const info = await identity.json();
  if (info.userId !== expectedUserId) throw new Error('Identiti akaun telah berubah. Operasi dibatalkan.');
  const results: SalesCase[] = [];
  let page = 0;
  let total = 0;
  do {
    const response = await fetch('/api/sales-cases?page=' + page, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Tidak dapat mendapatkan senarai case daripada akaun.');
    const data = await response.json();
    if (!Array.isArray(data.cases) || !Number.isSafeInteger(data.total) ||
      data.cases.some((row: SalesCase) => !isCaseDocument(row.document))) throw new Error('Data case tidak sah.');
    results.push(...data.cases);
    total = data.total;
    if (results.length < total && !data.cases.length) throw new Error('Senarai server berubah. Cuba semula.');
    page++;
  } while (results.length < total && page <= 10000);
  if (results.length !== total || new Set(results.map(row => row.id)).size !== results.length) {
    throw new Error('Senarai server tidak lengkap; salinan offline tidak dibuat.');
  }
  return results;
}
export default function OfflineControls({ userId }: { userId: string }) {
  const [supported, setSupported] = useState(true);
  const [exists, setExists] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const vaultRef = useRef<Vault | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    // The authenticated layout remounts this control for each account.
    // Avoid synchronous state writes in mount effect.
    vaultRef.current = null;
    if (!('indexedDB' in window) || !('crypto' in window) ||
      !window.crypto.subtle || !('serviceWorker' in navigator)) {
      void Promise.resolve().then(() => { if (mounted) setSupported(false); });
      return;
    }
    void loadOfflineApi()
      .then(api => api.accounts())
      .then(rows => { if (mounted) setExists(rows.some(row => row.id === userId)); })
      .catch(() => { if (mounted) setSupported(false); });
    return () => { mounted = false; vaultRef.current = null; };
  }, [userId]);

  const syncNow = useCallback(async (quiet = false) => {
    const vault = vaultRef.current;
    if (!vault || busyRef.current || !navigator.onLine) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      const result = await vault.sync();
      const rows = await getOnlineCases(userId);
      await vault.mergeRemote(rows);
      const local = await vault.all();
      const pending = local.filter(row => row.dirty || row.conflict).length;
      setNotice('Sync selesai: ' + result.synced + ' ke akaun, ' +
        pending + ' draft masih menunggu atau konflik. Akses sentiasa disemak oleh server.');
    } catch (failure) {
      if (!quiet) setError(failure instanceof Error ? failure.message : 'Sync tidak berjaya.');
    } finally { busyRef.current = false; setBusy(false); }
  }, [userId]);

  useEffect(() => {
    const online = () => { if (vaultRef.current) void syncNow(true); };
    window.addEventListener('online', online);
    return () => window.removeEventListener('online', online);
  }, [syncNow]);

  async function begin() {
    if (busyRef.current) return;
    setError(''); setNotice('');
    if (phrase.length < 10) { setError('Frasa laluan minimum 10 aksara.'); return; }
    if (!exists && phrase !== confirmPhrase) { setError('Pengesahan frasa laluan tidak sepadan.'); return; }
    busyRef.current = true; setBusy(true);
    try {
      const api = await loadOfflineApi();
      // The server must authorize a fresh session before opening a new vault.
      const remote = await getOnlineCases(userId);
      const vault = exists ? await api.unlock(userId, phrase) : await api.create(userId, phrase);
      await vault.mergeRemote(remote); // Never overwrite dirty local drafts.
      await navigator.serviceWorker.register('/offline-sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      vaultRef.current = vault;
      setExists(true); setUnlocked(true);
      const local = await vault.all();
      const outstanding = local.filter(row => row.dirty || row.conflict).length;
      setNotice(local.length + ' case tersedia pada peranti. ' +
        (outstanding ? outstanding + ' draft belum sync.' : 'Semua case bersedia untuk offline.') +
        ' Gunakan pautan Draft Offline sebelum memutuskan internet.');
      setPhrase(''); setConfirmPhrase('');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Persediaan offline gagal.');
    } finally { busyRef.current = false; setBusy(false); }
  }
  async function deleteLocal() {
    if (!vaultRef.current || busyRef.current) return;
    if (!window.confirm('Padam semua salinan case offline pada peranti ini? Draft belum sync akan hilang. Muat turun draft dahulu jika perlu.')) return;
    busyRef.current = true; setBusy(true); setError('');
    try {
      await vaultRef.current.clear();
      vaultRef.current = null; setUnlocked(false); setExists(false);
      setNotice('Data offline akaun ini telah dipadam daripada peranti.');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Gagal memadam data offline.'); }
    finally { busyRef.current = false; setBusy(false); }
  }

  return <section className="container card offline-controls" aria-label="BROS SELL mod offline">
    <div className="eyebrow">MOD OFFLINE · PILIHAN</div>
    <h2>Sales Case boleh disunting tanpa internet</h2>
    <p className="muted">Sediakan salinan tersulit pada peranti semasa akaun dan akses anda masih sah.
      Buka Draft Offline untuk sunting case sedia ada; penyegerakan memerlukan login dan akses aktif semula.</p>
    {!supported ? <p role="alert">Browser ini tidak menyediakan IndexedDB, Web Crypto dan Service Worker yang diperlukan. Gunakan pelayar moden melalui HTTPS.</p> : <>
      {!unlocked && <>
        <label className="field-label" htmlFor="offline-phrase">{exists ? 'Buka simpanan offline' : 'Cipta frasa laluan offline (minimum 10 aksara)'}</label>
        <input id="offline-phrase" className="input" type="password" autoComplete="off" value={phrase}
          onChange={event => setPhrase(event.target.value)} />
        {!exists && <>
          <label className="field-label" htmlFor="offline-confirm">Ulang frasa laluan</label>
          <input id="offline-confirm" className="input" type="password" autoComplete="off"
            value={confirmPhrase} onChange={event => setConfirmPhrase(event.target.value)} />
        </>}
        <button className="btn secondary" disabled={busy} onClick={() => void begin()}>
          {busy ? 'Menyediakan...' : exists ? 'Buka dan semak draft' : 'Sediakan offline'}
        </button>
      </>}
      {unlocked && <div className="case-actions">
        <a className="btn secondary" href="/offline.html">Buka Draft Offline</a>
        <button className="btn secondary" disabled={busy} onClick={() => void syncNow()}>
          {busy ? 'Menyegerak...' : 'Segerakkan sekarang'}
        </button>
        <button className="btn secondary" disabled={busy} onClick={() => void deleteLocal()}>Padam data offline peranti</button>
      </div>}
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
      <p className="field-note">Frasa laluan offline tidak boleh dipulihkan. Jangan gunakan peranti awam.
        Log keluar tidak menghapuskan salinan tersulit secara automatik. Tiada fail Library, token login atau sumber terlindung dicache.</p>
    </>}
  </section>;
}