import { format, parseISO, differenceInMinutes } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';
export function getCompanyTimezone(): string {
  return localStorage.getItem('companyTimezone') || DEFAULT_TIMEZONE;
}
export function setCompanyTimezone(tz: string): void {
  localStorage.setItem('companyTimezone', tz);
}
export function getCurrentDate(): string {
  return formatDateInTimezone(new Date());
}
export function formatDateInTimezone(date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: getCompanyTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}
export function formatTime(timestamp: Timestamp | null): string {
  if (!timestamp) return '--:--';
  const date = timestamp.toDate();
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: getCompanyTimezone(),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}
export function formatDateTime(timestamp: Timestamp | null): string {
  if (!timestamp) return '--';
  const date = timestamp.toDate();
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: getCompanyTimezone(),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(date);
}
export function formatDisplayDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd/MM/yyyy', { locale: vi });
  } catch {
    return dateStr;
  }
}
export function calculateDuration(checkIn: Timestamp | null, checkOut: Timestamp | null): number | null {
  if (!checkIn || !checkOut) return null;
  return differenceInMinutes(checkOut.toDate(), checkIn.toDate());
}
export function formatDuration(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '--';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
export function isToday(dateStr: string): boolean {
  return dateStr === getCurrentDate();
}
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}
export function getCurrentTimeDisplay(): string {
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: getCompanyTimezone(),
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}
