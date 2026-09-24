import { redirect } from "next/navigation";
import { hasWebOSAccess } from "@/lib/supabase/entitlement";

type Resource = {
  area: string;
  title: string;
  file: string;
  use: string;
};

const resources: Resource[] = [
  { area: "START HERE", title: "Quick Start Guide", file: "00_START_HERE/BROS_SELL_00_Quick_Start_Guide_v2.5.docx", use: "Orientasi dan cara menggunakan BROS SELL™." },
  { area: "IMPLEMENTATION", title: "Implementation Playbook + Scenario Launch Cards", file: "01_IMPLEMENTATION/BROS_SELL_01_Implementation_Playbook_v1.1_Scenario_Launch_Cards.docx", use: "Terjemahkan sistem kepada rutin dan situasi jualan sebenar." },
  { area: "BOOK", title: "Closing OS v2.5", file: "02_BOOK/BROS_SELL_02_Closing_OS_v2.5.pdf", use: "Rujukan utama untuk memahami keseluruhan Sales Operating System." },
  { area: "VISUAL SYSTEM", title: "Visual System V01–V12", file: "03_VISUAL_SYSTEM/BROS_SELL_03_Visual_System_V01-V12.pdf", use: "Peta visual untuk melihat hubungan antara komponen sistem." },
  { area: "TOOLKIT", title: "Sales Target Calculator + Operator Dashboard", file: "04_TOOLKIT/BROS_SELL_ASSET_01_Sales_Target_Calculator_Operator_Dashboard.xlsx", use: "Tetapkan sasaran dan pantau operasi jualan." },
  { area: "TOOLKIT", title: "Visual System Index", file: "04_TOOLKIT/BROS_SELL_ASSET_02_Visual_System_Index.xlsx", use: "Indeks pantas untuk sistem visual." },
  { area: "TOOLKIT", title: "Buyer Intelligence Canvas", file: "04_TOOLKIT/BROS_SELL_ASSET_03_Buyer_Intelligence_Canvas.xlsx", use: "Fahami konteks, masalah dan outcome buyer." },
  { area: "TOOLKIT", title: "BROS 5Q Worksheet", file: "04_TOOLKIT/BROS_SELL_ASSET_04_BROS_5Q_Worksheet.xlsx", use: "Soalan teras untuk mendapatkan maklumat yang diperlukan." },
  { area: "TOOLKIT", title: "Offer Stack Builder", file: "04_TOOLKIT/BROS_SELL_ASSET_05_Offer_Stack_Builder.xlsx", use: "Bina offer yang lebih jelas dan mudah difahami." },
  { area: "TOOLKIT", title: "Value Bridge Worksheet", file: "04_TOOLKIT/BROS_SELL_ASSET_06_Value_Bridge_Worksheet.xlsx", use: "Hubungkan masalah buyer kepada nilai dan outcome." },
  { area: "TOOLKIT", title: "Lead State Classifier", file: "04_TOOLKIT/BROS_SELL_ASSET_07_Lead_State_Classifier.xlsx", use: "Klasifikasikan state lead berdasarkan signal sebenar." },
  { area: "TOOLKIT", title: "Close Path Decision Tree", file: "04_TOOLKIT/BROS_SELL_ASSET_08_Close_Path_Decision_Tree.xlsx", use: "Tentukan laluan keputusan dan next step." },
  { area: "TOOLKIT", title: "Objection Playbook", file: "04_TOOLKIT/BROS_SELL_ASSET_09_Objection_Playbook.xlsx", use: "Gunakan apabila barrier atau objection perlu dijelaskan." },
  { area: "TOOLKIT", title: "WhatsApp Script Vault", file: "04_TOOLKIT/BROS_SELL_ASSET_10_WhatsApp_Script_Vault.xlsx", use: "Rujukan script untuk conversation WhatsApp." },
  { area: "TOOLKIT", title: "Follow-Up Ladder Library", file: "04_TOOLKIT/BROS_SELL_ASSET_11_Follow_Up_Ladder_Library.xlsx", use: "Struktur follow-up berdasarkan sebab dan timing." },
  { area: "TOOLKIT", title: "Customer Multiplication Planner", file: "04_TOOLKIT/BROS_SELL_ASSET_12_Customer_Multiplication_Planner.xlsx", use: "Terjemahkan sale yang berjaya kepada pattern yang boleh diulang." },
  { area: "TOOLKIT", title: "30-Day Implementation Tracker", file: "04_TOOLKIT/BROS_SELL_ASSET_13_30-Day_Implementation_Tracker.xlsx", use: "Pantau pelaksanaan sistem selama 30 hari." },
];

export default async function ResourcesPage() {
  if (!(await hasWebOSAccess())) redirect("/activate");

  const groups = ["START HERE", "IMPLEMENTATION", "BOOK", "VISUAL SYSTEM", "TOOLKIT"];

  return (
    <main className="container" style={{padding:"28px 0 60px"}}>
      <header className="app-header">
        <div>
          <div className="brand" style={{fontSize:24}}>BROS SELL™</div>
          <div className="muted">Resource Hub</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <a className="btn secondary" href="/app">Analyzer</a>
          <a className="btn secondary" href="/auth/signout">Keluar</a>
        </div>
      </header>

      <section className="hero">
        <p className="muted">THINK → SEE → USE → DO</p>
        <h1>Resource Hub</h1>
        <p className="muted hero-copy">
          Gunakan hub ini untuk mencari resource yang sesuai dengan masalah atau stage jualan anda.
          Fail asal berada dalam Customer Package v2.5.
        </p>
      </section>

      {groups.map((group) => (
        <section className="card resource-section" key={group}>
          <div className="eyebrow">{group}</div>
          <div className="resource-grid">
            {resources.filter((resource) => resource.area === group).map((resource) => (
              <article className="resource-card" key={resource.file}>
                <div>
                  <small className="muted">CUSTOMER PACKAGE</small>
                  <h2>{resource.title}</h2>
                  <p className="muted">{resource.use}</p>
                </div>
                <div className="resource-file">{resource.file}</div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="card">
        <div className="eyebrow">EXECUTION RULE</div>
        <h2>Jangan buka semua resource serentak.</h2>
        <p className="muted">
          Mulakan dengan Situation Analyzer. Gunakan diagnosis untuk menentukan stage, kemudian buka resource yang dirouting.
          Resource Hub ialah indeks; Customer Package kekal sebagai sumber fail utama.
        </p>
      </section>
    </main>
  );
}
