import { useEffect, useState } from 'react';
import { Filter, Edit2, Save, X, ChevronDown } from 'lucide-react';
import {
  getAllAttendance,
  adminUpdateAttendance,
  AttendanceFilter,
} from '../../services/attendanceService';
import { createAuditLog } from '../../services/auditService';
import { getAllUsers } from '../../services/userService';
import { AttendanceRecord, AttendanceStatus, UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { formatTime, formatDisplayDate, formatDuration, getCurrentDate } from '../../utils/dateUtils';
const PAGE_SIZE = 15;
export default function AttendanceManagement() {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    status: AttendanceStatus;
    notes: string;
  }>({ status: 'FULL_DAY', notes: '' });
  const [saving, setSaving] = useState(false);
  // Filters
  const [filters, setFilters] = useState<AttendanceFilter>({
    startDate: getCurrentDate(),
    endDate: getCurrentDate(),
  });
  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const [attendanceData, usersData] = await Promise.all([
        getAllAttendance(filters),
        getAllUsers(),
      ]);
      setRecords(attendanceData);
      setUsers(usersData);
    } catch (error) {
      showToast('Lỗi khi tải dữ liệu', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleSearch = async () => {
    setLoading(true);
    setCurrentPage(1);
    await loadData();
  };
  const startEdit = (record: AttendanceRecord) => {
    setEditingId(record.id);
    setEditData({ status: record.status, notes: record.notes });
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ status: 'FULL_DAY', notes: '' });
  };
  const saveEdit = async (record: AttendanceRecord) => {
    if (!userProfile) return;
    setSaving(true);
    try {
      const updates: { status?: AttendanceStatus; notes?: string } = {};
      if (editData.status !== record.status) updates.status = editData.status;
      if (editData.notes !== record.notes) updates.notes = editData.notes;
      if (Object.keys(updates).length === 0) {
        cancelEdit();
        return;
      }
      await adminUpdateAttendance(record.id, updates, userProfile.displayName);
      // Create audit log
      await createAuditLog({
        attendanceId: record.id,
        employeeId: record.employeeId,
        changedBy: userProfile.uid,
        changedByName: userProfile.displayName,
        action: 'ADMIN_EDIT',
        oldValues: { status: record.status, notes: record.notes },
        newValues: updates,
        reason: editData.notes || 'Admin chỉnh sửa',
      });
      showToast('Cập nhật thành công!', 'success');
      cancelEdit();
      loadData();
    } catch (error) {
      showToast('Lỗi khi cập nhật', 'error');
    } finally {
      setSaving(false);
    }
  };
  // Pagination
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const paginatedRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý chấm công</h1>
          <p className="text-gray-500 mt-1">{records.length} bản ghi</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="btn-secondary flex items-center gap-2"
        >
          <Filter size={18} />
          Bộ lọc
          <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {/* Filters */}
      {showFilters && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhân viên</label>
              <select
                value={filters.employeeId || ''}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value || undefined })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({ ...filters, status: (e.target.value as AttendanceStatus) || undefined })
                }
                className="input-field"
              >
                <option value="">Tất cả</option>
                <option value="FULL_DAY">Đủ công</option>
                <option value="HALF_DAY">Nửa buổi</option>
                <option value="OFF">Off</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã NV..."
                value={filters.searchTerm || ''}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value || undefined })}
                className="input-field"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary">
              Tìm kiếm
            </button>
          </div>
        </div>
      )}
      {/* Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : paginatedRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có bản ghi nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ngày</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Vào</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ra</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className={`hover:bg-gray-50 ${
                      !record.isComplete && record.checkInAt ? 'bg-orange-50/50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {record.employeeId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.employeeName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDisplayDate(record.date)}</td>
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
                      {editingId === record.id ? (
                        <select
                          value={editData.status}
                          onChange={(e) =>
                            setEditData({ ...editData, status: e.target.value as AttendanceStatus })
                          }
                          className="input-field text-sm py-1"
                        >
                          <option value="FULL_DAY">Đủ công</option>
                          <option value="HALF_DAY">Nửa buổi</option>
                          <option value="OFF">Off</option>
                        </select>
                      ) : (
                        <StatusBadge status={record.status} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingId === record.id ? (
                        <input
                          type="text"
                          value={editData.notes}
                          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                          className="input-field text-sm py-1"
                          placeholder="Ghi chú..."
                        />
                      ) : (
                        <span className="text-gray-500">{record.notes || '--'}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {editingId === record.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(record)}
                              disabled={saving}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Lưu"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                              title="Hủy"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(record)}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
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
