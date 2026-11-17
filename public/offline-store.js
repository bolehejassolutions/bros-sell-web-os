/* BROS SELL offline vault, browser-only. Never stores passwords, sessions or tokens. */
(function () {
  'use strict';
  const DB = 'bros-sell-offline-v1';
  const VERSION = 1;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const signature = 'BROS_SELL_OFFLINE_V1:';
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB, VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('accounts')) db.createObjectStore('accounts', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('cases')) db.createObjectStore('cases', { keyPath: ['account', 'id'] });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Tutup tab BROS SELL lain sebelum meneruskan.'));
    });
  }
  async function get(store, key) {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readonly');
        const request = tx.objectStore(store).get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }
  async function list(store) {
    const db = await open();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(store, 'readonly').objectStore(store).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  }
  async function put(store, entry) {
    const db = await open();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(store, 'readwrite');
        tx.objectStore(store).put(entry);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  async function removeAccount(account) {
    const db = await open();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(['accounts', 'cases'], 'readwrite');
        tx.objectStore('accounts').delete(account);
        const cursor = tx.objectStore('cases').openCursor();
        cursor.onsuccess = () => {
          const value = cursor.result;
          if (value) {
            if (value.value.account === account) value.delete();
            value.continue();
          }
        };
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }
  const encode = bytes => btoa(String.fromCharCode(...bytes));
  const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  async function keyFromPassword(password, salt) {
    if (!crypto?.subtle) throw new Error('Peranti ini tidak menyokong penyulitan selamat.');
    const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 230000, hash: 'SHA-256' },
      material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function seal(key, value, context) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(context) },
      key, encoder.encode(JSON.stringify(value)));
    return { iv: encode(iv), data: encode(new Uint8Array(encrypted)) };
  }
  async function unseal(key, payload, context) {
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(payload.iv),
      additionalData: encoder.encode(context) }, key, decode(payload.data));
    return JSON.parse(decoder.decode(plaintext));
  }
  const accountOk = account => typeof account === 'string' && /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(account);
  const caseOk = id => typeof id === 'string' && /^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id);
  const validCase = row => row && caseOk(row.id) && Number.isSafeInteger(row.revision) &&
    row.revision >= 1 && row.document && row.document.version === 1 &&
    typeof row.document.title === 'string' && typeof row.document.situation === 'string';
  async function create(account, password) {
    if (!accountOk(account)) throw new Error('Identiti akaun tidak sah.');
    if (typeof password !== 'string' || password.length < 10) throw new Error('Gunakan frasa laluan sekurang-kurangnya 10 aksara.');
    if (await get('accounts', account)) throw new Error('Simpanan sudah wujud. Buka menggunakan frasa laluan lama.');
    const salt = crypto.getRandomValues(new Uint8Array(24));
    const key = await keyFromPassword(password, salt);
    const verifier = await seal(key, signature + account, account);
    await put('accounts', { id: account, salt: encode(salt), verifier, created: new Date().toISOString() });
    return vault(account, key);
  }
  async function unlock(account, password) {
    if (!accountOk(account)) throw new Error('Identiti akaun tidak sah.');
    const meta = await get('accounts', account);
    if (!meta) throw new Error('Tiada simpanan offline untuk akaun ini.');
    try {
      const key = await keyFromPassword(password, decode(meta.salt));
      if ((await unseal(key, meta.verifier, account)) !== signature + account) throw Error('incorrect');
      return vault(account, key);
    } catch { throw new Error('Frasa laluan tidak betul atau data simpanan tidak dapat dibuka.'); }
  }
  function vault(account, key) {
    const recordContext = id => account + ':' + id;
    async function getRecord(id) {
      const item = await get('cases', [account, id]);
      if (!item) return null;
      const row = await unseal(key, item.encrypted, recordContext(id));
      return { ...row, dirty: item.dirty === true, conflict: item.conflict === true, localVersion: item.localVersion || 0 };
    }
    async function all() {
      const records = (await list('cases')).filter(x => x.account === account);
      return Promise.all(records.map(async item => {
        const row = await unseal(key, item.encrypted, recordContext(item.id));
        return { ...row, dirty: item.dirty === true, conflict: item.conflict === true, localVersion: item.localVersion || 0 };
      }));
    }
    async function saveDraft(id, document, expectedVersion) {
      if (!caseOk(id) || !document || document.version !== 1) throw new Error('Data case tidak sah.');
      const previous = await get('cases', [account, id]);
      if (!previous) throw new Error('Case perlu dimuat turun ketika online dahulu.');
      if (expectedVersion !== previous.localVersion) throw new Error('Draft telah dikemas kini dalam tab lain. Muat semula sebelum mengubah.');
      const existing = await unseal(key, previous.encrypted, recordContext(id));
      const nextVersion = previous.localVersion + 1;
      await put('cases', { ...previous, localVersion: nextVersion, dirty: true,
        encrypted: await seal(key, { ...existing, document }, recordContext(id)) });
      return nextVersion;
    }
    async function mergeRemote(rows) {
      if (!Array.isArray(rows) || rows.some(row => !validCase(row))) throw new Error('Data server tidak sah.');
      let updated = 0, retained = 0;
      for (const row of rows) {
        const previous = await get('cases', [account, row.id]);
        if (previous?.dirty || previous?.conflict) { retained++; continue; }
        await put('cases', { account, id: row.id, dirty: false, conflict: false, localVersion: (previous?.localVersion || 0) + 1,
          encrypted: await seal(key, row, recordContext(row.id)) });
        updated++;
      }
      return { updated, retained };
    }
    async function sync() {
      const proof = await fetch('/api/offline/identity', { cache: 'no-store', credentials: 'same-origin' });
      if (!proof.ok) throw new Error(proof.status === 401 || proof.status === 403 ?
        'Sesi/akses tidak sah. Log masuk secara online dahulu.' : 'Pengesahan akaun tidak tersedia.');
      const identity = await proof.json();
      if (identity.userId !== account) throw new Error('Akaun berbeza. Sync disekat untuk melindungi data.');
      const rows = await all();
      const results = { synced: 0, conflict: 0, pending: 0 };
      for (const row of rows.filter(row => row.dirty && !row.conflict)) {
        let response;
        try {
          response = await fetch('/api/sales-cases/' + encodeURIComponent(row.id), {
            method: 'PUT', credentials: 'same-origin', cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ revision: row.revision, document: row.document }),
            signal: AbortSignal.timeout(20000)
          });
        } catch { results.pending++; continue; }
        if (response.status === 409 || response.status === 404) {
          const current = await get('cases', [account, row.id]);
          if (current) await put('cases', { ...current, conflict: true, dirty: true });
          results.conflict++;
          continue;
        }
        if (response.status === 401 || response.status === 403) throw new Error('Akses sudah tamat. Penyegerakan dihentikan.');
        if (!response.ok) { results.pending++; continue; }
        const result = await response.json();
        if (!validCase(result.case)) { results.pending++; continue; }
        const current = await get('cases', [account, row.id]);
        if (!current) continue;
        if (current.localVersion !== row.localVersion) {
          const currentData = await unseal(key, current.encrypted, recordContext(row.id));
          await put('cases', { ...current, encrypted: await seal(key,
            { ...currentData, revision: result.case.revision }, recordContext(row.id)) });
          results.pending++;
          continue;
        }
        await put('cases', { ...current, dirty: false, conflict: false, localVersion: current.localVersion + 1,
          encrypted: await seal(key, result.case, recordContext(row.id)) });
        results.synced++;
      }
      return results;
    }
    return { account, all, getRecord, saveDraft, mergeRemote, sync, clear: () => removeAccount(account) };
  }
  async function accounts() { return (await list('accounts')).map(x => ({ id: x.id, created: x.created })); }
  window.BrosSellOfflineStore = Object.freeze({ accounts, create, unlock, removeAccount });
})();