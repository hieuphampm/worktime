import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  FileSpreadsheet,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Tổng quan', end: true },
  { to: '/admin/users', icon: Users, label: 'Nhân viên' },
  { to: '/admin/attendance', icon: ClipboardList, label: 'Chấm công' },
  { to: '/admin/history', icon: Calendar, label: 'Lịch sử' },
  { to: '/admin/export', icon: FileSpreadsheet, label: 'Xuất Excel' },
  { to: '/admin/audit', icon: ScrollText, label: 'Nhật ký' },
  { to: '/admin/settings', icon: Settings, label: 'Cài đặt' },
];
export default function AdminLayout() {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500">
          <Menu size={24} />
        </button>
        <h1 className="font-semibold text-gray-900">WorkTime Admin</h1>
        <div className="w-8" />
      </div>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <SidebarContent
              userProfile={userProfile}
              onSignOut={handleSignOut}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <SidebarContent userProfile={userProfile} onSignOut={handleSignOut} />
        </div>
      </div>
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
function SidebarContent({
  userProfile,
  onSignOut,
  onClose,
}: {
  userProfile: any;
  onSignOut: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-primary-600">WorkTime</h1>
          <p className="text-xs text-gray-500">Quản lý chấm công</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-gray-400">
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-sm">
              {userProfile?.displayName?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile?.displayName || 'Admin'}
            </p>
            <p className="text-xs text-gray-500 truncate">Quản trị viên</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}
