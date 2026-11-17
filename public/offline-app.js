/* Offline-only editor: all customer details remain encrypted in IndexedDB. */
(function () {
  'use strict';
  const node = id => document.getElementById(id);
  const store = window.BrosSellOfflineStore;
  let vault = null;
  let selected = null;
  let selectedVersion = 0;
  let timer = null;
  let unsaved = false;
  let saving = false;
  const fields = ['title', 'situation', 'evidence', 'channel', 'buyer', 'offer'];
  const error = message => { node('error').textContent = message || ''; };
  const status = message => { node('status').textContent = message || ''; error(''); };
  const safeMessage = exception => exception instanceof Error ? exception.message : 'Operasi tidak berjaya.';
  function currentDocument() {
    if (!selected) throw Error('Pilih case dahulu.');
    const documentValue = JSON.parse(JSON.stringify(selected.document));
    documentValue.title = node('title').value.trim();
    documentValue.situation = node('situation').value;
    documentValue.evidence = node('evidence').value;
    documentValue.channel = node('channel').value;
    documentValue.facts = documentValue.facts || {};
    documentValue.facts.buyer = node('buyer').value;
    documentValue.facts.offer = node('offer').value;
    return documentValue;
  }
  async function saveDraft() {
    if (!unsaved || !selected || saving) return;
    if (!node('title').value.trim()) { error('Tajuk case diperlukan.'); return; }
    const draft = currentDocument();
    unsaved = false;
    saving = true;
    try {
      selectedVersion = await vault.saveDraft(selected.id, draft, selectedVersion);
      selected.document = draft;
      status('Draft telah disulitkan dan disimpan pada peranti ini. Belum disegerakkan ke akaun.');
    } catch (failure) { unsaved = true; error(safeMessage(failure)); }
    finally {
      saving = false;
      if (unsaved) schedule();
    }
  }
  function schedule() {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { void saveDraft(); }, 650);
  }
  function changed() {
    unsaved = true;
    node('status').textContent = 'Sedang menyediakan simpanan setempat...';
    schedule();
  }
  function populate(row) {
    selected = row;
    selectedVersion = row.localVersion;
    node('editor').hidden = false;
    node('title').value = row.document.title || '';
    node('situation').value = row.document.situation || '';
    node('evidence').value = row.document.evidence || '';
    node('channel').value = row.document.channel || '';
    node('buyer').value = row.document.facts?.buyer || '';
    node('offer').value = row.document.facts?.offer || '';
    node('caseMeta').textContent = (row.conflict ? 'KONFLIK — Versi server telah berubah. Export draft sebelum menyelesaikan secara manual.' :
      row.dirty ? 'Perubahan setempat belum disegerakkan.' : 'Versi server terakhir disimpan pada peranti.') +
      ' Revisi asal: ' + row.revision;
    if (row.conflict) status('Konflik ditemui: data server tidak ditimpa.');
  }
  async function listCases(preferredId) {
    const rows = await vault.all();
    rows.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''));
    const select = node('cases');
    select.replaceChildren(new Option('Pilih case', ''));
    rows.forEach(row => select.add(new Option(
      (row.conflict ? '⚠ ' : row.dirty ? '• ' : '') + (row.document.title || 'Tanpa tajuk'), row.id)));
    const target = rows.find(x => x.id === preferredId) || rows[0];
    if (target) { select.value = target.id; populate(target); }
    else { selected = null; node('editor').hidden = true; node('caseMeta').textContent = 'Tiada case dimuat turun.'; }
  }
  async function unlock() {
    error('');
    const account = node('account').value;
    const passphrase = node('password').value;
    try {
      vault = await store.unlock(account, passphrase);
      node('password').value = '';
      node('unlockPanel').hidden = true;
      node('workspace').hidden = false;
      await listCases();
      status('Simpanan offline telah dibuka untuk sesi tab ini.');
      if (navigator.onLine) void syncNow(false);
    } catch (failure) { error(safeMessage(failure)); }
  }
  async function syncNow(explicit = true) {
    if (!vault) return;
    if (unsaved) await saveDraft();
    if (unsaved || saving) { error('Simpan draft setempat dahulu.'); return; }
    if (!navigator.onLine) {
      if (explicit) error('Internet belum tersedia. Perubahan kekal pada peranti.');
      return;
    }
    node('sync').disabled = true;
    try {
      const result = await vault.sync();
      await listCases(selected?.id);
      status('Sync: ' + result.synced + ' disimpan ke akaun; ' +
        result.pending + ' menunggu; ' + result.conflict + ' konflik. Tiada data konflik ditimpa.');
    } catch (failure) { error(safeMessage(failure)); }
    finally { node('sync').disabled = false; }
  }
  async function exportDraft() {
    if (!selected) return;
    if (unsaved) await saveDraft();
    const current = await vault.getRecord(selected.id);
    if (!current) return;
    const data = JSON.stringify({ caseId: current.id, revision: current.revision,
      document: current.document, exportedAt: new Date().toISOString() }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'bros-sell-offline-draft-' + current.id + '.json';
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    status('Salinan JSON telah dimuat turun. Simpan dengan selamat kerana fail ini tidak disulitkan.');
  }
  async function clearAccount() {
    if (!vault) return;
    if (!window.confirm('Padam SEMUA draft offline untuk akaun ini daripada peranti? Draft yang belum disegerakkan akan hilang. Export dahulu jika perlu.')) return;
    try {
      await vault.clear();
      vault = null; selected = null; unsaved = false;
      node('workspace').hidden = true;
      node('unlockPanel').hidden = false;
      await accounts();
      status('Simpanan offline akaun telah dipadam daripada peranti ini.');
    } catch (failure) { error(safeMessage(failure)); }
  }
  async function accounts() {
    try {
      const rows = await store.accounts();
      const select = node('account');
      select.replaceChildren(new Option(rows.length ? 'Pilih rekod akaun' : 'Tiada simpanan offline', ''));
      rows.forEach(row => select.add(new Option('Akaun ' + row.id.slice(0, 8), row.id)));
      node('unlockButton').disabled = rows.length === 0;
      if (!rows.length) error('Buka Web OS semasa online dan pilih “Sediakan offline” dahulu.');
    } catch (failure) { error(safeMessage(failure)); }
  }
  node('unlockButton').addEventListener('click', () => void unlock());
  node('password').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); void unlock(); }
  });
  node('cases').addEventListener('change', async () => {
    if (unsaved) await saveDraft();
    if (unsaved) { error('Draft belum selamat. Selesaikan simpanan sebelum menukar case.'); return; }
    const id = node('cases').value;
    const row = await vault.getRecord(id);
    if (row) populate(row);
  });
  node('caseForm').addEventListener('submit', event => { event.preventDefault(); void saveDraft(); });
  fields.forEach(id => node(id).addEventListener('input', changed));
  node('sync').addEventListener('click', () => void syncNow());
  node('export').addEventListener('click', () => void exportDraft());
  node('delete').addEventListener('click', () => void clearAccount());
  window.addEventListener('online', () => { if (vault) void syncNow(false); });
  window.addEventListener('beforeunload', event => {
    if (unsaved || saving) { event.preventDefault(); event.returnValue = ''; }
  });
  void accounts();
})();