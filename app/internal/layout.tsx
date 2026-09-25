export default function InternalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="app-shell-content">{children}</div>;
}
