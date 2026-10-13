export function companyDate(now = new Date(), timezone = 'Asia/Ho_Chi_Minh'): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function creditFor(status: 'FULL_DAY' | 'HALF_DAY' | 'OFF'): number {
  return status === 'FULL_DAY' ? 1 : status === 'HALF_DAY' ? 0.5 : 0;
}

export function statusForWorkDuration(minutes: number): 'FULL_DAY' | 'HALF_DAY' {
  return minutes >= 9 * 60 ? 'FULL_DAY' : 'HALF_DAY';
}

export function minutesBetween(start: string, end: string): number {
  const duration = Math.floor((Date.parse(end) - Date.parse(start)) / 60_000);
  if (!Number.isFinite(duration) || duration < 0) throw new Error('Thời điểm không hợp lệ');
  return duration;
}

export function companyLocalToIso(value: string, timezone: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) throw new Error('Thời điểm không hợp lệ');
  const parts = match.slice(1).map(Number);
  const desired = Date.UTC(parts[0]!, parts[1]! - 1, parts[2]!, parts[3]!, parts[4]!);
  let guess = desired;
  for (let i = 0; i < 3; i++) {
    const formatted = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23' }).formatToParts(new Date(guess));
    const values = Object.fromEntries(formatted.map((p) => [p.type, p.value]));
    const represented = Date.UTC(Number(values.year),Number(values.month)-1,Number(values.day),Number(values.hour),Number(values.minute));
    guess += desired - represented;
  }
  if (Math.abs(guess - desired) > 14 * 60 * 60 * 1000) throw new Error('Múi giờ không hợp lệ');
  return new Date(guess).toISOString();
}

export function excelDateInTimezone(value: string, timezone: string): Date {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23' }).formatToParts(new Date(value));
  const p = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second)));
}

export const statusLabels = { FULL_DAY: 'Đủ công', HALF_DAY: 'Nửa buổi', OFF: 'Off' } as const;
