import Sidebar from '../ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 p-7 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
