import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download, SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudentToolbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    statusFilter: string;
    setStatusFilter: (status: string) => void;
    classFilter: string;
    setClassFilter: (cls: string) => void;
    uniqueClasses: string[];
    isAdvancedMode: boolean;
    setIsAdvancedMode: (isAdvanced: boolean) => void;
    onExport: () => void;
    genderFilter: string;
    setGenderFilter: (gender: string) => void;
}

export function StudentToolbar({
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    classFilter,
    setClassFilter,
    uniqueClasses,
    isAdvancedMode,
    setIsAdvancedMode,
    onExport,
    genderFilter,
    setGenderFilter,
}: StudentToolbarProps) {
    return (
        <div className="space-y-4 bg-card p-4 rounded-lg border border-border shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students by name, school, or area..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background/50 focus:bg-background transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                        variant={isAdvancedMode ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                        className="flex-1 md:flex-none"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        {isAdvancedMode ? "Simple View" : "Advanced Filters"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onExport} className="flex-1 md:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <AnimatePresence>
                {isAdvancedMode && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder="Filter by Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Class</label>
                                <Select value={classFilter} onValueChange={setClassFilter}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder="Filter by Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {uniqueClasses.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {c}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-muted-foreground">Gender</label>
                                <Select value={genderFilter} onValueChange={setGenderFilter}>
                                    <SelectTrigger className="bg-background/50">
                                        <SelectValue placeholder="Filter by Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Genders</SelectItem>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Clear Filters Button could go here if logic was more complex */}
                            <div className="flex items-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                        setStatusFilter("all");
                                        setClassFilter("all");
                                        setGenderFilter("all");
                                        setSearchQuery("");
                                    }}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Reset Filters
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
