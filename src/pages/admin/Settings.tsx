import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Save, Globe } from 'lucide-react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToast } from '../../contexts/ToastContext';
import { CompanySettings } from '../../types';
import { setCompanyTimezone, getCompanyTimezone } from '../../utils/dateUtils';
const TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
];
export default function Settings() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Partial<CompanySettings>>({
    timezone: getCompanyTimezone(),
    workingHoursStart: '08:00',
    workingHoursEnd: '17:00',
    fullDayMinHours: 8,
    halfDayMinHours: 4,
    companyName: 'WorkTime',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadSettings();
  }, []);
  const loadSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'company');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as CompanySettings;
        setSettings(data);
        setCompanyTimezone(data.timezone);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'settings', 'company');
      await setDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now(),
        createdAt: settings.createdAt || Timestamp.now(),
      });
      if (settings.timezone) {
        setCompanyTimezone(settings.timezone);
      }
      showToast('Lưu cài đặt thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi lưu cài đặt', 'error');
    } finally {
      setSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
        <p className="text-gray-500 mt-1">Cấu hình thông số công ty</p>
      </div>
      <div className="max-w-2xl space-y-6">
        {/* Company info */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <SettingsIcon size={20} className="text-primary-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Thông tin công ty</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên công ty</label>
              <input
                type="text"
                value={settings.companyName || ''}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        </div>
        {/* Timezone */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Globe size={20} className="text-blue-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Múi giờ & giờ làm việc</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Múi giờ công ty</label>
              <select
                value={settings.timezone || 'Asia/Ho_Chi_Minh'}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="input-field"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
                <input
                  type="time"
                  value={settings.workingHoursStart || '08:00'}
                  onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
                <input
                  type="time"
                  value={settings.workingHoursEnd || '17:00'}
                  onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số giờ tối thiểu (đủ công)</label>
                <input
                  type="number"
                  value={settings.fullDayMinHours || 8}
                  onChange={(e) => setSettings({ ...settings, fullDayMinHours: Number(e.target.value) })}
                  className="input-field"
                  min={1}
                  max={24}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số giờ tối thiểu (nửa buổi)</label>
                <input
                  type="number"
                  value={settings.halfDayMinHours || 4}
                  onChange={(e) => setSettings({ ...settings, halfDayMinHours: Number(e.target.value) })}
                  className="input-field"
                  min={1}
                  max={24}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}
