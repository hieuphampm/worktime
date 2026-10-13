import React, { useEffect, useState } from 'react';
import { UserPlus, Search, ToggleLeft, ToggleRight, Key } from 'lucide-react';
import { getAllUsers } from '../../services/userService';
import { createUser, resetUserPassword, toggleUserStatus } from '../../services/authService';
import { UserProfile, UserRole, ROLE_LABELS } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
export default function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [confirmToggle, setConfirmToggle] = useState<UserProfile | null>(null);
  const { showToast } = useToast();
  // Create form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    employeeId: '',
    role: 'EMPLOYEE' as UserRole,
    department: '',
  });
  const [creating, setCreating] = useState(false);
  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  useEffect(() => {
    loadUsers();
  }, []);
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      showToast('Không thể tải danh sách nhân viên', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.displayName || !newUser.employeeId) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    setCreating(true);
    try {
      await createUser(newUser);
      showToast('Tạo tài khoản thành công!', 'success');
      setShowCreateModal(false);
      setNewUser({ email: '', password: '', displayName: '', employeeId: '', role: 'EMPLOYEE', department: '' });
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi tạo tài khoản', 'error');
    } finally {
      setCreating(false);
    }
  };
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    setResetting(true);
    try {
      await resetUserPassword(selectedUser.uid, newPassword);
      showToast('Đặt lại mật khẩu thành công!', 'success');
      setShowResetPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error: any) {
      showToast(error.message || 'Lỗi khi đặt lại mật khẩu', 'error');
    } finally {
      setResetting(false);
    }
  };
  const handleToggleStatus = async () => {
    if (!confirmToggle) return;
    try {
      await toggleUserStatus(confirmToggle.uid, !confirmToggle.isActive);
      showToast(
        confirmToggle.isActive ? 'Vô hiệu hóa tài khoản thành công' : 'Kích hoạt tài khoản thành công',
        'success'
      );
      setConfirmToggle(null);
      loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Lỗi', 'error');
    }
  };
  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
          <p className="text-gray-500 mt-1">{users.length} tài khoản</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={18} />
          Tạo tài khoản
        </button>
      </div>
      <div className="card mb-6">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, mã NV, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Đang tải...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không tìm thấy nhân viên nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Mã NV</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phòng ban</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Vai trò</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.employeeId}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{user.displayName}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.department || '--'}</td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetPasswordModal(true);
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                          title="Đặt lại mật khẩu"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => setConfirmToggle(user)}
                          className={`p-1.5 rounded-lg ${
                            user.isActive
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={user.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        >
                          {user.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Tạo tài khoản mới">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
            <input
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="input-field"
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
            <input
              type="text"
              value={newUser.displayName}
              onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã nhân viên *</label>
            <input
              type="text"
              value={newUser.employeeId}
              onChange={(e) => setNewUser({ ...newUser, employeeId: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phòng ban</label>
            <input
              type="text"
              value={newUser.department}
              onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
              className="input-field"
            >
              <option value="EMPLOYEE">Nhân viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </Modal>
      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setNewPassword('');
          setSelectedUser(null);
        }}
        title="Đặt lại mật khẩu"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Đặt lại mật khẩu cho: <strong>{selectedUser?.displayName}</strong> ({selectedUser?.email})
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              minLength={6}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowResetPasswordModal(false);
                setNewPassword('');
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button onClick={handleResetPassword} disabled={resetting || !newPassword} className="btn-primary">
              {resetting ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </div>
        </div>
      </Modal>
      {/* Toggle Status Confirm */}
      <ConfirmDialog
        isOpen={!!confirmToggle}
        title={confirmToggle?.isActive ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt tài khoản'}
        message={`Bạn có chắc muốn ${confirmToggle?.isActive ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản của ${confirmToggle?.displayName}?`}
        variant={confirmToggle?.isActive ? 'danger' : 'info'}
        onConfirm={handleToggleStatus}
        onCancel={() => setConfirmToggle(null)}
      />
    </div>
  );
}
