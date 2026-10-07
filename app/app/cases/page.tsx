import OperatingCaseList from "../operating-case-list";

export default function CasesPage() {
  return (
    <main className="container simple-page">
      <section className="simple-hero compact">
        <div className="eyebrow">CASES</div>
        <h1>Apa yang perlukan perhatian?</h1>
        <p className="muted hero-copy">Sambung case berdasarkan tindakan, susulan dan keputusan yang masih belum selesai.</p>
      </section>
      <OperatingCaseList />
    </main>
  );
}
