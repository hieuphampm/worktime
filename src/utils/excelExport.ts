import ExcelJS from 'exceljs';
import { AttendanceRecord, STATUS_LABELS, STATUS_CREDITS, UserProfile } from '../types';
import { formatTime, formatDisplayDate, formatDuration, formatDateTime } from './dateUtils';
export async function exportToExcel(
  records: AttendanceRecord[],
  userMap: Map<string, UserProfile>,
  fileName: string
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'WorkTime';
  workbook.created = new Date();
  // ========== Sheet 1: Detail ==========
  const detailSheet = workbook.addWorksheet('Chi ti\u1ebft ch\u1ea5m c\u00f4ng');
  // Headers
  const headers = [
    'M\u00e3 NV',
    'H\u1ecd t\u00ean',
    'Ph\u00f2ng ban',
    'Ng\u00e0y',
    'Gi\u1edd v\u00e0o',
    'Gi\u1edd ra',
    'Th\u1eddi gian l\u00e0m',
    'Tr\u1ea1ng th\u00e1i',
    'C\u00f4ng',
    'Ghi ch\u00fa',
    'S\u1eeda b\u1edfi',
    'S\u1eeda l\u00fac',
  ];
  detailSheet.columns = [
    { header: headers[0], key: 'employeeId', width: 12 },
    { header: headers[1], key: 'employeeName', width: 22 },
    { header: headers[2], key: 'department', width: 16 },
    { header: headers[3], key: 'date', width: 14 },
    { header: headers[4], key: 'checkIn', width: 12 },
    { header: headers[5], key: 'checkOut', width: 12 },
    { header: headers[6], key: 'duration', width: 14 },
    { header: headers[7], key: 'status', width: 14 },
    { header: headers[8], key: 'credit', width: 8 },
    { header: headers[9], key: 'notes', width: 24 },
    { header: headers[10], key: 'modifiedBy', width: 16 },
    { header: headers[11], key: 'modifiedAt', width: 20 },
  ];
  // Style header row
  const headerRow = detailSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '2563EB' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 24;
  // Add data rows
  records.forEach((record) => {
    const user = userMap.get(record.employeeId);
    detailSheet.addRow({
      employeeId: record.employeeId,
      employeeName: record.employeeName,
      department: user?.department || '',
      date: formatDisplayDate(record.date),
      checkIn: formatTime(record.checkInAt),
      checkOut: formatTime(record.checkOutAt),
      duration: formatDuration(record.workingDurationMinutes),
      status: STATUS_LABELS[record.status],
      credit: STATUS_CREDITS[record.status],
      notes: record.notes || '',
      modifiedBy: record.lastModifiedBy || '',
      modifiedAt: record.updatedAt ? formatDateTime(record.updatedAt) : '',
    });
  });
  // Style data rows
  for (let i = 2; i <= records.length + 1; i++) {
    const row = detailSheet.getRow(i);
    row.alignment = { vertical: 'middle' };
    if (i % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F3F4F6' },
      };
    }
  }
  // Add borders
  const totalRows = records.length + 1;
  for (let r = 1; r <= totalRows; r++) {
    const row = detailSheet.getRow(r);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } },
      };
    });
  }
  // Auto-filter
  detailSheet.autoFilter = {
    from: 'A1',
    to: `L${totalRows}`,
  };
  // ========== Sheet 2: Summary ==========
  const summarySheet = workbook.addWorksheet('T\u1ed5ng h\u1ee3p');
  // Compute summary by employee
  const employeeSummary = new Map<string, {
    name: string;
    department: string;
    fullDay: number;
    halfDay: number;
    off: number;
    totalCredit: number;
  }>();
  records.forEach((record) => {
    const user = userMap.get(record.employeeId);
    if (!employeeSummary.has(record.employeeId)) {
      employeeSummary.set(record.employeeId, {
        name: record.employeeName,
        department: user?.department || '',
        fullDay: 0,
        halfDay: 0,
        off: 0,
        totalCredit: 0,
      });
    }
    const entry = employeeSummary.get(record.employeeId)!;
    if (record.status === 'FULL_DAY') entry.fullDay++;
    else if (record.status === 'HALF_DAY') entry.halfDay++;
    else if (record.status === 'OFF') entry.off++;
    entry.totalCredit += record.attendanceCredit;
  });
  summarySheet.columns = [
    { header: 'M\u00e3 NV', key: 'employeeId', width: 12 },
    { header: 'H\u1ecd t\u00ean', key: 'name', width: 22 },
    { header: 'Ph\u00f2ng ban', key: 'department', width: 16 },
    { header: '\u0110\u1ee7 c\u00f4ng', key: 'fullDay', width: 10 },
    { header: 'N\u1eeda bu\u1ed5i', key: 'halfDay', width: 10 },
    { header: 'Off', key: 'off', width: 8 },
    { header: 'T\u1ed5ng c\u00f4ng', key: 'totalCredit', width: 12 },
  ];
  // Style summary header
  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '059669' },
  };
  summaryHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  summaryHeaderRow.height = 24;
  // Add summary data
  let totalFullDay = 0, totalHalfDay = 0, totalOff = 0, totalCredit = 0;
  employeeSummary.forEach((data, empId) => {
    summarySheet.addRow({
      employeeId: empId,
      name: data.name,
      department: data.department,
      fullDay: data.fullDay,
      halfDay: data.halfDay,
      off: data.off,
      totalCredit: data.totalCredit,
    });
    totalFullDay += data.fullDay;
    totalHalfDay += data.halfDay;
    totalOff += data.off;
    totalCredit += data.totalCredit;
  });
  // Grand total row
  const grandTotalRow = summarySheet.addRow({
    employeeId: '',
    name: 'T\u1ed4NG C\u1ed8NG',
    department: '',
    fullDay: totalFullDay,
    halfDay: totalHalfDay,
    off: totalOff,
    totalCredit: totalCredit,
  });
  grandTotalRow.font = { bold: true };
  grandTotalRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'DBEAFE' },
  };
  // Add borders to summary
  const summaryTotalRows = employeeSummary.size + 2;
  for (let r = 1; r <= summaryTotalRows; r++) {
    const row = summarySheet.getRow(r);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'D1D5DB' } },
        left: { style: 'thin', color: { argb: 'D1D5DB' } },
        bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
        right: { style: 'thin', color: { argb: 'D1D5DB' } },
      };
    });
  }
  // ========== Info row at bottom ==========
  summarySheet.addRow({});
  const statsRow = summarySheet.addRow({ employeeId: 'Th\u1ed1ng k\u00ea:' });
  statsRow.font = { bold: true };
  summarySheet.addRow({ employeeId: `T\u1ed5ng nh\u00e2n vi\u00ean: ${employeeSummary.size}` });
  summarySheet.addRow({ employeeId: `T\u1ed5ng b\u1ea3n ghi: ${records.length}` });
  summarySheet.addRow({ employeeId: `T\u1ed5ng c\u00f4ng: ${totalCredit}` });
  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
