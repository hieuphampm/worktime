import { useEffect, useState } from 'react';
import { getAllAttendance, AttendanceFilter } from '../../services/attendanceService';
import { getAllUsers } from '../../services/userService';
import { AttendanceRecord, AttendanceStatus, UserProfile } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { formatTime, formatDisplayDate, formatDuration, getMonthRange } from '../../utils/dateUtils';
const PAGE_SIZE = 20;
export default function AttendanceHistory() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortField, setSortField] = useState<'date' | 'employeeName' | 'status'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  useEffect(() => {
    loadUsers();
  }, []);
  useEffect(() => {
    loadHistory();
  }, [selectedMonth, selectedEmployee, selectedStatus]);
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };
  const loadHistory = async () => {
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const { start, end } = getMonthRange(year, month);
      const filters: AttendanceFilter = {
        startDate: start,
        endDate: end,
      };
      if (selectedEmployee) filters.employeeId = selectedEmployee;
      if (selectedStatus) filters.status = selectedStatus as AttendanceStatus;
      const data = await getAllAttendance(filters);
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };
  // Sorting
  const sortedRecords = [...records].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'date') cmp = a.date.localeCompare(b.date);
    else if (sortField === 'employeeName') cmp = a.employeeName.localeCompare(b.employeeName);
    else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
    return sortDir === 'asc' ? cmp : -cmp;
  });
  const totalPages = Math.ceil(sortedRecords.length / PAGE_SIZE);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  // Summary
  const summary = records.reduce(
    (acc, r) => {
      if (r.status === 'FULL_DAY') acc.fullDay++;
      else if (r.status === 'HALF_DAY') acc.halfDay++;
      else if (r.status === 'OFF') acc.off++;
      acc.totalCredit += r.attendanceCredit;
      return acc;
    },
    { fullDay: 0, halfDay: 0, off: 0, totalCredit: 0 }
  );
  const handleSort = (field: 'date' | 'employeeName' | 'status') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };
  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="text-primary-600 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử chấm công</h1>
        <p className="text-gray-500 mt-1">{records.length} bản ghi</p>
      </div>
      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tháng</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input-field"
            >
              <option value="">Tất cả</option>
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
              <option value="">Tất cả</option>
              <option value="FULL_DAY">Đủ công</option>
              <option value="HALF_DAY">Nửa buổi</option>
              <option value="OFF">Off</option>
            </select>
          </div>
        </div>
      </div>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600">Đủ công</p>
          <p className="text-xl font-bold text-green-700">{summary.fullDay}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-600">Nửa buổi</p>
          <p className="text-xl font-bold text-yellow-700">{summary.halfDay}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600">Off</p>
          <p className="text-xl font-bold text-red-700">{summary.off}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600">Tổng công</p>
          <p className="text-xl font-bold text-blue-700">{summary.totalCredit}</p>
        </div>
      </div>
      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có dữ liệu</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('employeeName')}
                  >
                    Họ tên <SortIcon field="employeeName" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('date')}
                  >
                    Ngày <SortIcon field="date" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vào</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Trạng thái <SortIcon field="status" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sửa bởi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className={`hover:bg-gray-50 ${!record.isComplete && record.checkInAt ? 'bg-orange-50/50' : ''}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.employeeId}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDisplayDate(record.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatTime(record.checkInAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.checkOutAt ? formatTime(record.checkOutAt) : record.checkInAt ? <span className="text-orange-500 text-xs font-medium">Chưa ra</span> : '--:--'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDuration(record.workingDurationMinutes)}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate">{record.notes || '--'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{record.lastModifiedBy || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
}
