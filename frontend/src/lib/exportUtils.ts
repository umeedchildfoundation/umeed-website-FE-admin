import { api } from "@/lib/api";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";

export const exportToExcel = async () => {
    try {
        // Fetch data
        const [volunteers, students, applications] = await Promise.all([
            api.from('volunteers').select('*'),
            api.from('students').select('*'),
            api.from('volunteer_applications').select('*')
        ]);

        const wb = XLSX.utils.book_new();

        // Volunteers Sheet
        if (volunteers.data) {
            const wsVolunteers = XLSX.utils.json_to_sheet(volunteers.data);
            XLSX.utils.book_append_sheet(wb, wsVolunteers, "Volunteers");
        }

        // Students Sheet
        if (students.data) {
            const wsStudents = XLSX.utils.json_to_sheet(students.data);
            XLSX.utils.book_append_sheet(wb, wsStudents, "Students");
        }

        // Applications Sheet
        if (applications.data) {
            const wsApplications = XLSX.utils.json_to_sheet(applications.data);
            XLSX.utils.book_append_sheet(wb, wsApplications, "Applications");
        }

        // Save file
        XLSX.writeFile(wb, `umeed_data_export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        return { success: true };
    } catch (error) {
        console.error("Export failed:", error);
        return { success: false, error };
    }
};

export const exportToPDF = async () => {
    try {
        const doc = new jsPDF();
        const date = format(new Date(), 'yyyy-MM-dd');

        // Header
        doc.setFontSize(20);
        doc.text("UMEED Children Foundation - Data Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated on: ${date}`, 14, 30);

        // Fetch data
        const [volunteers, students] = await Promise.all([
            api.from('volunteers').select('*'),
            api.from('students').select('*')
        ]);

        let finalY = 40;

        // Volunteers Section
        if (volunteers.data && volunteers.data.length > 0) {
            doc.setFontSize(16);
            doc.text(`Volunteers (${volunteers.data.length})`, 14, finalY);

            const volData = volunteers.data.map((v: any) => [
                v.name,
                v.email,
                v.phone || '-',
                v.status
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Name', 'Email', 'Phone', 'Status']],
                body: volData,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185] }
            });

            // @ts-ignore
            finalY = doc.lastAutoTable.finalY + 15;
        }

        // Students Section
        if (students.data && students.data.length > 0) {
            // Check if we need a new page
            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(16);
            doc.text(`Students (${students.data.length})`, 14, finalY);

            const studData = students.data.map((s: any) => [
                s.full_name,
                s.class_grade || '-',
                s.school_name || '-',
                s.status
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Name', 'Class', 'School', 'Status']],
                body: studData,
                theme: 'grid',
                headStyles: { fillColor: [230, 126, 34] }
            });
        }

        doc.save(`umeed_report_${date}.pdf`);
        return { success: true };
    } catch (error) {
        console.error("PDF Export failed:", error);
        return { success: false, error };
    }
};
