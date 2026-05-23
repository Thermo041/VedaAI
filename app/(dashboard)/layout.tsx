import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <div className="min-h-screen flex-1 lg:pl-80">
          <Header />
          <main className="px-4 pb-28 pt-5 sm:px-6 lg:px-6 lg:pb-8 lg:pt-5">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
