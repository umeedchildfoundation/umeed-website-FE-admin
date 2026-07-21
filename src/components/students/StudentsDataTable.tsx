import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Eye } from "lucide-react";
import type { Student } from "../../types/student";

type StudentExtended = Student & {id: string, image_url: string, location_code: string, enrollment_date: string}

interface StudentsDataTableProps {
    students: StudentExtended[];
    isLoading: boolean;
    isAdmin: boolean;
    onView: (student: Student) => void;
    density?: "comfortable" | "compact";
}

export function StudentsDataTable({
    students,
    isLoading,
    onView,
    density = "comfortable",
}: StudentsDataTableProps) {
    if (isLoading) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground animate-pulse">
                Loading students data...
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <p className="text-lg font-medium text-foreground">No students found</p>
                <p className="text-sm">Try adjusting your filters or adding a new student.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[100px]">Student ID</TableHead>
                            <TableHead className="w-[220px]">Student</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead className="hidden md:table-cell">School</TableHead>
                            <TableHead className="hidden md:table-cell">Area</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id} className="group hover:bg-muted/30 transition-colors">
                                <TableCell className={`py-3 ${density === 'compact' ? 'py-1' : 'py-3'}`}>
                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium font-mono border border-primary/20 shadow-sm">
                                        {student.roll_number || student.id}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className={`${density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'} border-2 border-background shadow-sm ring-1 ring-border/50`}>
                                            <AvatarImage src={student.image_url || ""} alt={student.full_name} className="object-cover" />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {student.full_name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div
                                            className="flex flex-col cursor-pointer max-w-[180px]"
                                            onClick={() => onView(student)}
                                        >
                                            <span className="font-semibold text-sm text-foreground hover:text-primary hover:underline transition-colors truncate">
                                                {student.full_name}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {student.gender || "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-muted-foreground">
                                    {student.class_grade || "-"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                    {student.school_name || "-"}
                                </TableCell>
                                <TableCell className="hidden md:table-cell text-muted-foreground">
                                    {student.area_locality || "-"}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant={student.status === "active" ? "default" : "secondary"}
                                        className={`capitalize ${student.status === "active"
                                            ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200"
                                            : ""
                                            }`}
                                    >
                                        {student.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => onView(student)} title="View Profile">
                                            <Eye className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
