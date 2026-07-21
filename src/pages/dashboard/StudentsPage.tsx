import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentsApi } from "../../services/studentsApi";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "../../components/ui/button";
import { useToast } from "../../hooks/use-toast";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import { StudentProfileSheet } from "../../components/students/StudentProfileSheet";
// New components
import {
  StudentForm,
  type StudentFormData,
  emptyStudent,
} from "../../components/students/StudentForm";
import { StudentToolbar } from "../../components/students/StudentToolbar";
import { StudentsDataTable } from "../../components/students/StudentsDataTable";
import { generateStudentId, getStudentIdSequentialNumber } from "../../lib/studentConfig";
import type { Student } from "../../types/student";

// This should optimally be in a types file or inferred from Supabase
// We are extending the type to include image_url and roll_number

type StudentExtended = Student & {id: string, image_url: string, location_code: string, enrollment_date: string}

export default function StudentsPage() {
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();

  // State for Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // State for Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentExtended | null>(null);

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => studentsApi.getAll() as Promise<StudentExtended[]>,
  });

  const createMutation = useMutation({
    mutationFn: async (student: StudentFormData) => {
      if (!student.full_name) throw new Error("Full name is required");
      if (!student.location_code) throw new Error("Location is required");

      // Find max roll number (global now)
      let maxSeq = 0;
      if (students) {
        students.forEach((s) => {
          const seq = getStudentIdSequentialNumber(s.roll_number);
          if (seq > maxSeq) maxSeq = seq;
        });
      }

      const newRollNumber = generateStudentId(maxSeq);

      // Build insert object with only valid fields
      // Exclude fields that might not exist in DB or have empty values
      const insertData: Partial<StudentExtended> = {
        full_name: student.full_name,
        date_of_birth: student.date_of_birth,
        school_name: student.school_name,
        class_grade: student.class_grade,
        parent_guardian_name: student.parent_guardian_name,
        parent_contact_number: student.parent_contact_number,
        address: student.address,
        area_locality: student.area_locality,
        status: student.status || "active",
        notes: student.notes,
        location_code: student.location_code,
        roll_number: newRollNumber,
        documents: student.documents || [],
      };

      // Only add gender if it has a valid value (to avoid constraint errors)
      if (student.gender && student.gender.trim() !== "") {
        insertData.gender = student.gender;
      }

      // Only add image_url if it has a value (column might not exist)
      if (student.image_url) {
        insertData.image_url = student.image_url;
      }

      await studentsApi.create(insertData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Student added successfully" });
      setIsModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error adding student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (student: StudentFormData) => {
      if (!selectedStudent?.id) throw new Error("No student selected");

      // Build update object with only valid fields
      const updateData: Student & {location_code?: string | null, image_url?: string} = {
        full_name: student.full_name,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        school_name: student.school_name,
        class_grade: student.class_grade,
        parent_guardian_name: student.parent_guardian_name,
        parent_contact_number: student.parent_contact_number,
        address: student.address,
        area_locality: student.area_locality,
        status: student.status || "active",
        notes: student.notes,
        roll_number: student.roll_number,
        documents: student.documents || [],
      };

      // Only update these if the user can edit them (super admin)
      if (isSuperAdmin) {
        if (student.location_code) updateData.location_code = student.location_code;
        if (student.roll_number) updateData.roll_number = student.roll_number;
      }

      // Only add image_url if it has a value
      if (student.image_url) {
        updateData.image_url = student.image_url;
      }

      await studentsApi.update(selectedStudent.id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast({ title: "Student updated successfully" });
      setIsModalOpen(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      toast({
        title: "Error updating student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStudents = students?.filter((student) => {
    const matchesSearch =
      student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.area_locality?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.school_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.status === statusFilter;
    const matchesClass =
      classFilter === "all" || student.class_grade === classFilter;
    const matchesGender =
      genderFilter === "all" || student.gender === genderFilter;

    return matchesSearch && matchesStatus && matchesClass && matchesGender;
  });

  const uniqueClasses = [
    ...new Set(students?.map((s) => s.class_grade).filter(Boolean)),
  ].sort() as string[];

  const handleFormSubmit = async (data: StudentFormData) => {
    if (selectedStudent) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleEdit = (student: StudentExtended) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleView = (student: Student) => {
    const s = student as StudentExtended
    setSelectedStudent(s);
    setIsProfileOpen(true);
  };

  const handleAddStart = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  }

  const exportToCSV = () => {
    if (!filteredStudents?.length) return;
    const headers = [
      "Name",
      "Gender",
      "Class",
      "School",
      "Area",
      "Status",
      "Enrollment Date",
    ];
    const rows = filteredStudents.map((s) => [
      s.full_name,
      s.gender || "",
      s.class_grade || "",
      s.school_name || "",
      s.area_locality || "",
      s.status,
      // s.enrollment_date || "", // Removed from interface if not present in new type, usually created_at
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 container max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Students Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage student records, track progress, and view profiles.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleAddStart} size="lg" className="shadow-md">
            <Plus className="w-5 h-5 mr-2" />
            Add New Student
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Students",
            value: students?.length || 0,
            // Using a generic user icon if Lucide's Users is not imported, but assume we add imports
            icon: "Users",
            color: "text-blue-600 bg-blue-100 dark:bg-blue-900/20"
          },
          {
            label: "Active",
            value: students?.filter(s => s.status === 'active').length || 0,
            icon: "CheckCircle2",
            color: "text-green-600 bg-green-100 dark:bg-green-900/20"
          },
          {
            label: "Boys",
            value: students?.filter(s => s.gender?.toLowerCase() === 'male').length || 0,
            icon: "User",
            color: "text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20"
          },
          {
            label: "Girls",
            value: students?.filter(s => s.gender?.toLowerCase() === 'female').length || 0,
            icon: "User",
            color: "text-pink-600 bg-pink-100 dark:bg-pink-900/20"
          },
        ].map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
            {/* We will need to properly import icons or render them conditionally */}
            <div className={`p-3 rounded-xl ${stat.color}`}>
              {/* Placeholder for icon rendering logic */}
              <span className="font-bold text-lg">#</span>
            </div>
          </div>
        ))}
      </div>

      <StudentToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        uniqueClasses={uniqueClasses}
        isAdvancedMode={isAdvancedMode}
        setIsAdvancedMode={setIsAdvancedMode}
        onExport={exportToCSV}
        genderFilter={genderFilter}
        setGenderFilter={setGenderFilter}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StudentsDataTable
          students={filteredStudents || []}
          isLoading={isLoading}
          isAdmin={isAdmin}
          onView={handleView}
          density={user?.preferences?.tableDensity as "compact" | "comfortable" | undefined}
        />
      </motion.div>

      <StudentForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        // Force re-mount on student change to reset form
        key={selectedStudent?.id || "new"}
        isSuperAdmin={isSuperAdmin}
        initialData={
          selectedStudent
            ? {
              ...emptyStudent,
              ...selectedStudent,
              // ensure non-null strings
              full_name: selectedStudent.full_name || "",
              gender: selectedStudent.gender || "",
              date_of_birth: selectedStudent.date_of_birth || "",
              school_name: selectedStudent.school_name || "",
              class_grade: selectedStudent.class_grade || "",
              parent_guardian_name: "",
              notes: selectedStudent.notes || "",
              status: selectedStudent.status,
              image_url: selectedStudent.image_url || "",
              location_code: selectedStudent.location_code || "",
              roll_number: selectedStudent.roll_number || "",
              documents: selectedStudent.documents || [],
            }
            : undefined
        }
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <StudentProfileSheet
        student={selectedStudent}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onEdit={(student) => {
          setIsProfileOpen(false);
          handleEdit(student);
        }}
      />
    </div>
  );
}
