export const onboardingKinds = ['initial', 'reminder_24h', 'reminder_72h', 'access_confirmed'] as const;
export type OnboardingKind = typeof onboardingKinds[number];

const login = 'https://brossell.bolehejas.com/login';
const app = 'https://brossell.bolehejas.com/app';
const support = 'brossell@bolehejas.com';
const signoff = '\n\nBOLEHEJAS SOLUTIONS\nBROS SELL™ — Closing OS\n“Menjelaskan, bukan Memujuk.”';

export function onboardingMessage(kind: OnboardingKind) {
  const greeting = 'Assalamualaikum dan salam sejahtera,\n\n';
  switch (kind) {
    case 'initial': return {
      subject: 'BROS SELL™ — Panduan mula menggunakan Web OS',
      text: greeting + `Terima kasih atas pembelian BROS SELL™ — Closing OS.\n\nUntuk menggunakan Web OS, buka ${login} dan daftar atau log masuk menggunakan emel yang sama seperti pembelian. Sahkan emel jika diminta, kemudian buka ruang aplikasi.\n\nPakej digital boleh dimuat turun melalui penghantaran HitPay. Penghantaran pakej dan akses Web OS ialah dua perkara berasingan.\n\nJika akses masih perlu disemak, hubungi ${support} daripada emel pembelian. Anda tidak perlu membeli sekali lagi. Jangan kongsi kata laluan, OTP atau maklumat kad.` + signoff,
    };
    case 'reminder_24h': return {
      subject: 'BROS SELL™ — Perlukan bantuan untuk akses Web OS?',
      text: greeting + `Akses Web OS bagi pembelian ini masih belum selesai diaktifkan.\n\nBuka ${login} menggunakan emel pembelian, sahkan emel jika diminta, kemudian buka ruang aplikasi. Jika anda menggunakan Google, pastikan emelnya sama dengan emel pembelian.\n\nJika anda sudah mencuba tetapi masih tersekat, hubungi ${support} daripada emel pembelian. Jangan kongsi kata laluan atau OTP.` + signoff,
    };
    case 'reminder_72h': return {
      subject: 'BROS SELL™ — Peringatan terakhir untuk akses Web OS',
      text: greeting + `Ini peringatan terakhir untuk melengkapkan akses Web OS bagi pembelian ini.\n\nBuka ${login} menggunakan emel pembelian. Jika akses masih perlu disemak, hubungi ${support}; kami boleh membantu memadankan pembelian anda. Anda tidak perlu membeli sekali lagi.\n\nSelepas ini, tiada lagi peringatan pengaktifan automatik bagi pembelian ini. Pakej digital yang dihantar melalui HitPay kekal berasingan daripada proses akses Web OS.` + signoff,
    };
    case 'access_confirmed': return {
      subject: 'BROS SELL™ — Akses Web OS anda telah diaktifkan',
      text: greeting + `Akses Web OS bagi pembelian ini telah berjaya diaktifkan.\n\nAnda boleh meneruskan penggunaan di ${app}. Log masuk menggunakan emel pembelian yang sama. Peringatan pengaktifan bagi pembelian ini telah dihentikan.\n\nUntuk bantuan atau pemulihan akses, hubungi ${support} daripada emel pembelian. Jangan kongsi kata laluan atau OTP.` + signoff,
    };
  }
}

export function onboardingMime(to: string, id: string, kind: OnboardingKind) {
  if (!/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(to)) throw new Error('Invalid recipient.');
  if (!/^[a-f0-9-]{36}$/i.test(id) || !onboardingKinds.includes(kind)) throw new Error('Invalid delivery identity.');
  const message = onboardingMessage(kind);
  const chunks: string[] = [];
  let chunk = '';
  for (const character of message.subject) {
    if (Buffer.byteLength(chunk + character) > 42) { chunks.push(chunk); chunk = ''; }
    chunk += character;
  }
  if (chunk) chunks.push(chunk);
  const subject = chunks.map(value => `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`).join('\r\n ');
  const encodedBody = Buffer.from(message.text, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') ?? '';
  return Buffer.from([
    'From: BOLEHEJAS SOLUTIONS <bolehejassolutions@gmail.com>',
    `To: ${to}`,
    `Reply-To: ${support}`,
    `Message-ID: <bros-sell-${id}@brossell.bolehejas.com>`,
    `Date: ${new Date().toUTCString()}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '', encodedBody,
  ].join('\r\n')).toString('base64url');
}
