import 'react';
import { AttendanceStatus, STATUS_LABELS } from '../../types';
interface StatusBadgeProps {
  status: AttendanceStatus;
  className?: string;
}
const statusStyles: Record<AttendanceStatus, string> = {
  FULL_DAY: 'bg-green-100 text-green-800',
  HALF_DAY: 'bg-yellow-100 text-yellow-800',
  OFF: 'bg-red-100 text-red-800',
};
export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
