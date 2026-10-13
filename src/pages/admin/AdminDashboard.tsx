import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  LogIn,
  LogOut,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { getTodayStats } from '../../services/attendanceService';
import { getActiveEmployeeCount } from '../../services/userService';
import { getCurrentDate, formatDisplayDate } from '../../utils/dateUtils';
interface DashboardStats {
  totalEmployees: number;
  totalCheckedIn: number;
  totalCheckedOut: number;
  fullDay: number;
  halfDay: number;
  off: number;
  incomplete: number;
}
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalCheckedIn: 0,
    totalCheckedOut: 0,
    fullDay: 0,
    halfDay: 0,
    off: 0,
    incomplete: 0,
  });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadStats();
  }, []);
  const loadStats = async () => {
    try {
      const [todayStats, employeeCount] = await Promise.all([
        getTodayStats(),
        getActiveEmployeeCount(),
      ]);
      setStats({
        totalEmployees: employeeCount,
        ...todayStats,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };
  const cards = [
    {
      title: 'Tổng nhân viên',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Đã vào',
      value: stats.totalCheckedIn,
      icon: LogIn,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Đã ra',
      value: stats.totalCheckedOut,
      icon: LogOut,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      title: 'Đủ công',
      value: stats.fullDay,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700',
    },
    {
      title: 'Nửa buổi',
      value: stats.halfDay,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      title: 'Off',
      value: stats.off,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      title: 'Chưa hoàn thành',
      value: stats.incomplete,
      icon: AlertCircle,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
  ];
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-500 mt-1">
          Ngày {formatDisplayDate(getCurrentDate())}
        </p>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-12 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.title} className="card hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center justify-center w-10 h-10 ${card.bgColor} rounded-lg mb-3`}>
                <card.icon size={20} className={card.textColor} />
              </div>
              <p className="text-sm text-gray-500">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor} mt-1`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/admin/attendance"
          className="card hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Quản lý chấm công</h3>
            <p className="text-sm text-gray-500 mt-1">Xem và chỉnh sửa bảng chấm công</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
        <Link
          to="/admin/users"
          className="card hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Quản lý nhân viên</h3>
            <p className="text-sm text-gray-500 mt-1">Tạo và quản lý tài khoản</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
        <Link
          to="/admin/export"
          className="card hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Xuất báo cáo</h3>
            <p className="text-sm text-gray-500 mt-1">Xuất dữ liệu chấm công ra Excel</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
        <Link
          to="/admin/audit"
          className="card hover:shadow-md transition-shadow flex items-center justify-between group"
        >
          <div>
            <h3 className="font-semibold text-gray-900">Nhật ký hệ thống</h3>
            <p className="text-sm text-gray-500 mt-1">Xem lịch sử chỉnh sửa</p>
          </div>
          <ArrowRight size={20} className="text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
