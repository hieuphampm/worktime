import { useState, useEffect } from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import { getAllAttendance, AttendanceFilter } from '../../services/attendanceService';
import { getAllUsers } from '../../services/userService';
import { AttendanceStatus, UserProfile } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { getMonthRange } from '../../utils/dateUtils';
import { exportToExcel } from '../../utils/excelExport';
export default function ExcelExport() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportMode, setExportMode] = useState<'month' | 'range'>('month');
  useEffect(() => {
    loadUsers();
  }, []);
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  const handleExport = async () => {
    setLoading(true);
    try {
      let filters: AttendanceFilter = {};
      if (exportMode === 'month') {
        const [year, month] = selectedMonth.split('-').map(Number);
        const range = getMonthRange(year, month);
        filters.startDate = range.start;
        filters.endDate = range.end;
      } else {
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
      }
      if (selectedEmployee) filters.employeeId = selectedEmployee;
      if (selectedStatus) filters.status = selectedStatus as AttendanceStatus;
      const records = await getAllAttendance(filters);
      if (records.length === 0) {
        showToast('Không có dữ liệu để xuất', 'warning');
        return;
      }
      // Build user map for department lookup
      const userMap = new Map(users.map(u => [u.employeeId, u]));
      const fileName = exportMode === 'month'
        ? `Attendance_Report_${selectedMonth.replace('-', '_')}`
        : `Attendance_Report_${startDate || 'all'}_${endDate || 'all'}`;
      await exportToExcel(records, userMap, fileName);
      showToast('Xuất báo cáo thành công!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Lỗi khi xuất báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Xuất báo cáo Excel</h1>
        <p className="text-gray-500 mt-1">Xuất dữ liệu chấm công ra file Excel</p>
      </div>
      <div className="card max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet size={24} className="text-green-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Cài đặt xuất báo cáo</h2>
            <p className="text-sm text-gray-500">Chọn thông tin cần xuất</p>
          </div>
        </div>
        <div className="space-y-4">
          {/* Export mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kiểu xuất</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportMode"
                  value="month"
                  checked={exportMode === 'month'}
                  onChange={() => setExportMode('month')}
                  className="text-primary-600"
                />
                <span className="text-sm">Theo tháng</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportMode"
                  value="range"
                  checked={exportMode === 'range'}
                  onChange={() => setExportMode('range')}
                  className="text-primary-600"
                />
                <span className="text-sm">Theo khoảng ngày</span>
              </label>
            </div>
          </div>
          {exportMode === 'month' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input-field"
            >
              <option value="">Tất cả nhân viên</option>
              {users.map((u) => (
                <option key={u.uid} value={u.employeeId}>
                  {u.displayName} ({u.employeeId})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="FULL_DAY">Đủ công</option>
              <option value="HALF_DAY">Nửa buổi</option>
              <option value="OFF">Off</option>
            </select>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="btn-success w-full flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xuất...
              </>
            ) : (
              <>
                <Download size={18} />
                Xuất báo cáo Excel
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
