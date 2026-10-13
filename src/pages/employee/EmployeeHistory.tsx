import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getEmployeeAttendanceHistory } from '../../services/attendanceService';
import { AttendanceRecord } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { formatTime, formatDisplayDate, formatDuration, getMonthRange } from '../../utils/dateUtils';
const PAGE_SIZE = 20;
export default function EmployeeHistory() {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  useEffect(() => {
    loadHistory();
  }, [userProfile, selectedMonth]);
  const loadHistory = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const { start, end } = getMonthRange(year, month);
      const data = await getEmployeeAttendanceHistory(
        userProfile.employeeId,
        start,
        end
      );
      setRecords(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const paginatedRecords = records.slice(
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
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lịch sử chấm công</h1>
          <p className="text-gray-500 text-sm mt-1">{records.length} bản ghi</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="input-field w-auto"
          />
        </div>
      </div>
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-green-50 rounded-lg p-3 text-center">
          <p className="text-xs text-green-600">Đủ công</p>
          <p className="text-lg font-bold text-green-700">{summary.fullDay}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 text-center">
          <p className="text-xs text-yellow-600">Nửa buổi</p>
          <p className="text-lg font-bold text-yellow-700">{summary.halfDay}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-3 text-center">
          <p className="text-xs text-red-600">Off</p>
          <p className="text-lg font-bold text-red-700">{summary.off}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <p className="text-xs text-blue-600">Tổng công</p>
          <p className="text-lg font-bold text-blue-700">{summary.totalCredit}</p>
        </div>
      </div>
      {/* Records */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có dữ liệu chấm công trong tháng này
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vào</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr key={record.id} className={`${
                    !record.isComplete && record.checkInAt ? 'bg-orange-50/50' : ''
                  }`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatDisplayDate(record.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatTime(record.checkInAt)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {record.checkOutAt ? (
                        formatTime(record.checkOutAt)
                      ) : record.checkInAt ? (
                        <span className="text-orange-500 text-xs font-medium">Chưa ra</span>
                      ) : (
                        '--:--'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDuration(record.workingDurationMinutes)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{record.notes || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
