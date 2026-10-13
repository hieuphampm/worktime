import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { getAuditLogs } from '../../services/auditService';
import { getAllUsers } from '../../services/userService';
import { AuditLogEntry, UserProfile, STATUS_LABELS } from '../../types';
import Pagination from '../../components/common/Pagination';
import { formatDateTime } from '../../utils/dateUtils';
const PAGE_SIZE = 20;
const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE_STATUS: 'Cập nhật trạng thái',
  UPDATE_CHECKIN: 'Sửa giờ vào',
  UPDATE_CHECKOUT: 'Sửa giờ ra',
  UPDATE_NOTES: 'Sửa ghi chú',
  ADMIN_EDIT: 'Admin chỉnh sửa',
};
export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  useEffect(() => {
    loadData();
  }, [selectedEmployee]);
  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, usersData] = await Promise.all([
        getAuditLogs({
          employeeId: selectedEmployee || undefined,
          limitCount: 200,
        }),
        getAllUsers(),
      ]);
      setLogs(logsData);
      setUsers(usersData);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };
  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const formatChanges = (oldValues: Record<string, unknown>, newValues: Record<string, unknown>) => {
    const changes: string[] = [];
    for (const key of Object.keys(newValues)) {
      const oldVal = key === 'status' && oldValues[key] ? STATUS_LABELS[oldValues[key] as keyof typeof STATUS_LABELS] || String(oldValues[key]) : String(oldValues[key] ?? '--');
      const newVal = key === 'status' && newValues[key] ? STATUS_LABELS[newValues[key] as keyof typeof STATUS_LABELS] || String(newValues[key]) : String(newValues[key] ?? '--');
      changes.push(`${key}: ${oldVal} → ${newVal}`);
    }
    return changes.join(', ');
  };
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký hệ thống</h1>
          <p className="text-gray-500 mt-1">{logs.length} bản ghi</p>
        </div>
      </div>
      <div className="card mb-6">
        <div className="max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo nhân viên</label>
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
      </div>
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : paginatedLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ScrollText size={40} className="mx-auto mb-3 text-gray-300" />
            Chưa có nhật ký nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Nhân viên</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thay đổi</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Người sửa</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lý do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(log.createdAt)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{log.employeeId}</td>
                    <td className="px-4 py-3">
                      <span className="badge badge-info">{ACTION_LABELS[log.action] || log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[250px] truncate">
                      {formatChanges(log.oldValues, log.newValues)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.changedByName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[150px] truncate">{log.reason || '--'}</td>
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
