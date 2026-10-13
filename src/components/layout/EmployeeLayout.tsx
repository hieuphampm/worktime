import 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LayoutDashboard, Calendar, LogOut } from 'lucide-react';
export default function EmployeeLayout() {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-primary-600">WorkTime</h1>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink
                to="/employee"
                end
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <LayoutDashboard size={18} />
                Chấm công
              </NavLink>
              <NavLink
                to="/employee/history"
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
              >
                <Calendar size={18} />
                Lịch sử
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{userProfile?.displayName}</p>
              <p className="text-xs text-gray-500">{userProfile?.employeeId}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Đăng xuất"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
        {/* Mobile bottom nav */}
        <div className="sm:hidden border-t border-gray-100 flex">
          <NavLink
            to="/employee"
            end
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Chấm công
          </NavLink>
          <NavLink
            to="/employee/history"
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium ${
                isActive ? 'text-primary-600' : 'text-gray-500'
              }`
            }
          >
            <Calendar size={16} />
            Lịch sử
          </NavLink>
        </div>
      </header>
      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 pt-28 sm:pt-20 pb-8">
        <Outlet />
      </main>
    </div>
  );
}
