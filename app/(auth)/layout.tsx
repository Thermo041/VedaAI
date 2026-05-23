export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f4f4f3_0%,#dedfdd_100%)]">
      {children}
    </div>
  );
}
