import Link from 'next/link';

const SALES_PAGE = "https://bros.bolehejas.com";

export default function ActivatePage() {
  const email = process.env.BROS_SUPPORT_EMAIL || "brossell@bolehejas.com";
  return (
    <main className="container card" style={{ marginTop: 60 }}>
      <h1>Akses akaun perlu disemak.</h1>
      <p>Jika anda sudah membeli BROS SELL, gunakan email pembelian yang sama untuk log masuk. Anda tidak perlu membuat pembelian semula untuk menyelesaikan masalah akses.</p>
      <p>Untuk pemulihan akses, hubungi <a href={`mailto:${encodeURIComponent(email)}?subject=BROS%20SELL%20access%20recovery`}>{email}</a> menggunakan email pembelian. Anda boleh sertakan rujukan pesanan atau resit HitPay.</p>
      <p>Jangan hantar password, OTP atau maklumat kad.</p>
      <p>HitPay menghantar pakej pelanggan yang boleh dimuat turun secara berasingan. Akses Web OS dikaitkan dengan email pembelian; Web OS ialah companion online yang diselenggara.</p>
      <p>Permohonan refund boleh dibuat dalam 30 hari kalendar dari tarikh pembelian melalui {email}, menggunakan email pembelian.</p>
      <div className="case-actions">
        <a className="btn" href={`mailto:${encodeURIComponent(email)}?subject=BROS%20SELL%20access%20recovery`}>Hubungi sokongan</a>
        <Link className="btn secondary" href="/login">Kembali ke login</Link>
        <a className="btn secondary" href={SALES_PAGE}>Maklumat BROS SELL</a>
      </div>
    </main>
  );
}
