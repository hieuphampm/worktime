import { useEffect, useState, useCallback } from 'react';
import { LogIn, LogOut, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { checkIn, checkOut, getTodayAttendance } from '../../services/attendanceService';
import { AttendanceRecord } from '../../types';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatTime, formatDuration, getCurrentTimeDisplay } from '../../utils/dateUtils';
export default function EmployeeDashboard() {
  const { userProfile } = useAuth();
  const { showToast } = useToast();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(getCurrentTimeDisplay());
  const [confirmCheckIn, setConfirmCheckIn] = useState(false);
  const [confirmCheckOut, setConfirmCheckOut] = useState(false);
  const loadTodayRecord = useCallback(async () => {
    if (!userProfile) return;
    try {
      const record = await getTodayAttendance(userProfile.employeeId);
      setTodayRecord(record);
    } catch (error) {
      console.error('Error loading today record:', error);
    } finally {
      setLoading(false);
    }
  }, [userProfile]);
  useEffect(() => {
    loadTodayRecord();
  }, [loadTodayRecord]);
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeDisplay());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const handleCheckIn = async () => {
    if (!userProfile) return;
    setActionLoading(true);
    try {
      await checkIn(userProfile.employeeId, userProfile.displayName);
      showToast('Chấm công vào thành công!', 'success');
      loadTodayRecord();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi chấm công vào', 'error');
    } finally {
      setActionLoading(false);
      setConfirmCheckIn(false);
    }
  };
  const handleCheckOut = async () => {
    if (!userProfile) return;
    setActionLoading(true);
    try {
      await checkOut(userProfile.employeeId);
      showToast('Chấm công ra thành công!', 'success');
      loadTodayRecord();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi chấm công ra', 'error');
    } finally {
      setActionLoading(false);
      setConfirmCheckOut(false);
    }
  };
  const hasCheckedIn = !!todayRecord?.checkInAt;
  const hasCheckedOut = !!todayRecord?.checkOutAt;
  return (
    <div className="max-w-lg mx-auto">
      {/* User info & time */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-3">
          <span className="text-2xl font-bold text-primary-600">
            {userProfile?.displayName?.charAt(0) || 'N'}
          </span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{userProfile?.displayName}</h1>
        <p className="text-sm text-gray-500">{userProfile?.employeeId} | {userProfile?.department || 'Chưa phân phòng'}</p>
        <p className="text-sm text-gray-400 mt-2">{currentTime}</p>
      </div>
      {/* Today status card */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hôm nay</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <LogIn size={14} />
                  Giờ vào
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {todayRecord ? formatTime(todayRecord.checkInAt) : '--:--'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <LogOut size={14} />
                  Giờ ra
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {todayRecord ? formatTime(todayRecord.checkOutAt) : '--:--'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Clock size={14} />
                  Thời gian làm
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {todayRecord ? formatDuration(todayRecord.workingDurationMinutes) : '--'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <CheckCircle size={14} />
                  Trạng thái
                </div>
                {todayRecord ? (
                  <StatusBadge status={todayRecord.status} className="mt-1" />
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Chưa chấm công</p>
                )}
              </div>
            </div>
            {/* Incomplete warning */}
            {hasCheckedIn && !hasCheckedOut && (
              <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm">
                <AlertCircle size={16} />
                Bạn chưa chấm công ra hôm nay
              </div>
            )}
          </div>
        )}
      </div>
      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setConfirmCheckIn(true)}
          disabled={hasCheckedIn || actionLoading || loading}
          className={`flex flex-col items-center gap-2 py-6 rounded-xl font-medium transition-all ${
            hasCheckedIn
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200 hover:shadow-green-300'
          }`}
        >
          <LogIn size={28} />
          <span>Chấm công vào</span>
          {hasCheckedIn && <span className="text-xs">Đã chấm công</span>}
        </button>
        <button
          onClick={() => setConfirmCheckOut(true)}
          disabled={!hasCheckedIn || hasCheckedOut || actionLoading || loading}
          className={`flex flex-col items-center gap-2 py-6 rounded-xl font-medium transition-all ${
            !hasCheckedIn || hasCheckedOut
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200 hover:shadow-primary-300'
          }`}
        >
          <LogOut size={28} />
          <span>Chấm công ra</span>
          {hasCheckedOut && <span className="text-xs">Đã chấm công</span>}
        </button>
      </div>
      {/* Notes from admin */}
      {todayRecord?.notes && (
        <div className="card mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Ghi chú</h3>
          <p className="text-sm text-gray-600">{todayRecord.notes}</p>
          {todayRecord.lastModifiedBy && (
            <p className="text-xs text-gray-400 mt-1">Chỉnh sửa bởi: {todayRecord.lastModifiedBy}</p>
          )}
        </div>
      )}
      {/* Confirm dialogs */}
      <ConfirmDialog
        isOpen={confirmCheckIn}
        title="Xác nhận chấm công vào"
        message="Bạn có chắc muốn chấm công vào? Hành động này không thể hoàn tác."
        variant="info"
        confirmLabel="Chấm công vào"
        onConfirm={handleCheckIn}
        onCancel={() => setConfirmCheckIn(false)}
        loading={actionLoading}
      />
      <ConfirmDialog
        isOpen={confirmCheckOut}
        title="Xác nhận chấm công ra"
        message="Bạn có chắc muốn chấm công ra? Hành động này không thể hoàn tác."
        variant="info"
        confirmLabel="Chấm công ra"
        onConfirm={handleCheckOut}
        onCancel={() => setConfirmCheckOut(false)}
        loading={actionLoading}
      />
    </div>
  );
}
