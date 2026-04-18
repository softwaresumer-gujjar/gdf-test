import Sidebar from '../ui/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}
