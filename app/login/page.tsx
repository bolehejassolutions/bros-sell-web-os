import Link from "next/link";
import LoginForm from "./login-form";

const failedCallbacks = new Set([
  "auth_code_missing", "auth_exchange_failed", "auth_confirm_missing", "auth_confirm_failed",
]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="container" style={{ paddingTop: 80, maxWidth: 520 }}>
      <div className="card">
        <div className="brand" style={{ fontSize: 28 }}>BROS SELL™</div>
        <p className="muted">Closing OS</p>
        <h1>Masuk ke Web OS</h1>
        {typeof error === "string" && failedCallbacks.has(error) && (
          <div role="alert">
            <p>Pautan log masuk tidak dapat digunakan. Minta pautan baharu dengan emel pembelian anda dan buka pautan terkini pada peranti yang sama.</p>
            <p>Jika anda masih sukar masuk, <Link href="/activate">hubungi sokongan BROS SELL</Link>.</p>
          </div>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
