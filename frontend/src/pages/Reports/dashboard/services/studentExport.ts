import type { StudentSummary } from '../types';
import { searchStudents } from './studentApi';
import type { SearchStudentsOptions } from './studentApi';

// The largest page the reports API returns.
const PAGE_SIZE = 100;

async function fetchAllStudents(options: SearchStudentsOptions): Promise<StudentSummary[]> {
  const all: StudentSummary[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await searchStudents({ ...options, page, limit: PAGE_SIZE });
    all.push(...result.students);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return all;
}

/**
 * Downloads every student matching the given filters as an Excel file,
 * not only the page currently on screen.
 */
export async function exportStudentsToExcel(
  options: SearchStudentsOptions,
  keep: (student: StudentSummary) => boolean,
): Promise<number> {
  const students = (await fetchAllStudents(options)).filter(keep);

  // Loaded on demand because the library is large and rarely needed.
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('תלמידים', { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });

  sheet.columns = [
    { header: 'שם מלא', key: 'name', width: 24 },
    { header: 'ת"ז', key: 'taz', width: 14 },
    { header: 'מחזור', key: 'class', width: 20 },
    { header: 'דוא"ל', key: 'email', width: 30 },
    { header: 'מטופלים', key: 'client', width: 10 },
    { header: 'הדרכה מאושרת', key: 'mentor', width: 14 },
    { header: 'טיפול אישי', key: 'therapist', width: 11 },
    { header: 'ממתין לאישור', key: 'pending', width: 13 },
    { header: 'הצהרה חתומה', key: 'signature', width: 13 },
    { header: 'סטטוס', key: 'status', width: 10 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const s of students) {
    sheet.addRow({
      name: `${s.firstName} ${s.lastName}`.trim(),
      taz: s.taz,
      class: s.className,
      email: s.email,
      client: s.clientHours,
      mentor: s.mentorApprovedHours,
      therapist: s.therapistHours,
      pending: s.mentorPendingHours,
      signature: s.signatureSubmitted ? 'הוגשה' : 'טרם הוגשה',
      status: s.status === 'frozen' ? 'בהקפאה' : 'פעיל',
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `students-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);

  return students.length;
}
