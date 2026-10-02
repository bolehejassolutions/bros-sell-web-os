import Link from 'next/link';

const SALES_PAGE = "https://bros.bolehejas.com";

export default function ActivatePage() {
  const email = process.env.BROS_SUPPORT_EMAIL;
  return <main className="container card" style={{ marginTop: 60 }}><h1>Akses akaun perlu disemak.</h1><p>Jika anda sudah membeli BROS SELL, gunakan email pembelian yang sama untuk log masuk. Anda tidak perlu membuat pembelian semula untuk menyelesaikan masalah akses.</p><p>Sertakan rujukan pesanan dan email pembelian melalui saluran sokongan dalam pengesahan pembelian anda.</p><div className="case-actions">{email && <a className="btn" href={`mailto:${encodeURIComponent(email)}?subject=BROS%20SELL%20access%20recovery`}>Hubungi sokongan</a>}<Link className="btn secondary" href="/login">Kembali ke login</Link><a className="btn secondary" href={SALES_PAGE}>Maklumat BROS SELL</a></div></main>;
}
