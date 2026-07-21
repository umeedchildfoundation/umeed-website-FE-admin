import { volunteersApi } from "../services/volunteersApi";
import { studentsApi } from "../services/studentsApi";
import { applicationsApi } from "../services/applicationsApi";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export const exportToExcel = async () => {
  try {
    const [volunteers, students, applications] = await Promise.all([
      volunteersApi.getAll(),
      studentsApi.getAll(),
      applicationsApi.getAll(),
    ]);

    const wb = XLSX.utils.book_new();

    if (volunteers.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(volunteers),
        "Volunteers",
      );
    }
    if (students.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(students),
        "Students",
      );
    }
    if (applications.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(applications),
        "Applications",
      );
    }

    XLSX.writeFile(
      wb,
      `umeed_data_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`,
    );
    return { success: true };
  } catch (error) {
    console.error("Export failed:", error);
    return { success: false, error };
  }
};

export const exportToPDF = async () => {
  try {
    const doc = new jsPDF();
    const date = format(new Date(), "yyyy-MM-dd");

    // Header
    doc.setFontSize(20);
    doc.text("UMEED Children Foundation - Data Report", 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated on: ${date}`, 14, 30);

    const [volunteers, students] = await Promise.all([
      volunteersApi.getAll(),
      studentsApi.getAll(),
    ]);

    let finalY = 40;

    // Volunteers Section
    if (volunteers.length > 0) {
      doc.setFontSize(16);
      doc.text(`Volunteers (${volunteers.length})`, 14, finalY);

      const volData = volunteers.map((v: any) => [
        v.name,
        v.email,
        v.phone || "-",
        v.status,
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Name", "Email", "Phone", "Status"]],
        body: volData,
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      });

      // @ts-expect-error it is giving error
      finalY = doc.lastAutoTable.finalY + 15;
    }

    // Students Section
    if (students.length > 0) {
      if (finalY > 250) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(16);
      doc.text(`Students (${students.length})`, 14, finalY);

      const studData = students.map((s: any) => [
        s.full_name,
        s.class_grade || "-",
        s.school_name || "-",
        s.status,
      ]);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Name", "Class", "School", "Status"]],
        body: studData,
        theme: "grid",
        headStyles: { fillColor: [230, 126, 34] },
      });
    }

    doc.save(`umeed_report_${date}.pdf`);
    return { success: true };
  } catch (error) {
    console.error("PDF Export failed:", error);
    return { success: false, error };
  }
};
