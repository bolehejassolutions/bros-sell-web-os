export const onboardingKinds = ['initial', 'reminder_24h', 'reminder_72h', 'access_confirmed'] as const;
export type OnboardingKind = typeof onboardingKinds[number];

const login = 'https://brossell.bolehejas.com/login';
const app = 'https://brossell.bolehejas.com/app';
export const onboardingSender = 'brossell@bolehejas.com';
const support = onboardingSender;
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

export type OnboardingMail = {
  from: { name: string; address: typeof onboardingSender };
  to: { address: string };
  replyTo: typeof onboardingSender;
  envelope: { from: typeof onboardingSender; to: [string] };
  messageId: string;
  subject: string;
  text: string;
  encoding: 'base64';
  disableFileAccess: true;
  disableUrlAccess: true;
};

export function onboardingMail(to: string, id: string, kind: OnboardingKind): OnboardingMail {
  // One plain mailbox only. Nodemailer handles RFC822 encoding; caller-supplied
  // display names, extra recipients and header/control characters are refused.
  if (to.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(to)) {
    throw new Error('Invalid recipient.');
  }
  const local = to.split('@')[0];
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) throw new Error('Invalid recipient.');
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id) || !onboardingKinds.includes(kind)) {
    throw new Error('Invalid delivery identity.');
  }
  const message = onboardingMessage(kind);
  return {
    from: { name: 'BROS SELL™ — BOLEHEJAS SOLUTIONS', address: onboardingSender },
    to: { address: to }, replyTo: onboardingSender,
    envelope: { from: onboardingSender, to: [to] },
    messageId: `<bros-sell-${id.toLowerCase()}@brossell.bolehejas.com>`,
    subject: message.subject, text: message.text, encoding: 'base64',
    disableFileAccess: true, disableUrlAccess: true,
  };
}
