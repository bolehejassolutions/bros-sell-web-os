/**
 * Single source of truth for Web OS Customer Hub release communication.
 * This describes the offline customer package, not the deployed Web OS build.
 * Only change after verifying canonical release bytes and customer distribution.
 */
export const CUSTOMER_RELEASE = {
  packageVersion: "v2.6.1",
  packageName: "BROS_SELL_CLOSING_OS_v2.6.1_CUSTOMER_PACKAGE.zip",
  checksumSha256: "6f1d85a3a87a250a8498bdc0d1c988aabd08c75af1b4300748f3413bbb5ac0cc",
  publishedDate: "2026-10-10",
  patchDate: "2026-10-09",
  bookVersion: "v2.5",
  bookPages: 104,
  bookChapters: 36,
  mapCount: 12,
  workbookCount: 13,
  quickStartVersion: "v2.6.1",
  playbookVersion: "v1.2.1",
  updateTitle: "Pembetulan panduan dan kalkulator",
  updateSummary: "Pakej v2.6.1 membetulkan validasi kalkulator sasaran, penjajaran pelan pelaksanaan, arahan akses, rujukan senario, istilah navigasi dan susun atur Quick Start. Buku PDF dan peta visual tidak diubah.",
  affectedAudience: "Pelanggan yang menggunakan pakej muat turun BROS SELL.",
  actionRequired: "Gunakan ZIP v2.6.1 daripada penghantaran pembelian HitPay. Jika fail atau pautan tidak dijumpai, hubungi sokongan menggunakan emel pembelian.",
} as const;
