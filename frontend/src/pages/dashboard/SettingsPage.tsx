import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Download, Layout, FileSpreadsheet, FileText, Home } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, exportToPDF } from "@/lib/exportUtils";

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [startPage, setStartPage] = useState("dashboard");
  const [tableDensity, setTableDensity] = useState("comfortable");
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (user?.preferences) {
      setStartPage(user.preferences.startPage || "dashboard");
      setTableDensity(user.preferences.tableDensity || "comfortable");
    }
  }, [user]);

  const handlePreferenceUpdate = async (key: string, value: string) => {
    // Optimistic update
    if (key === 'startPage') setStartPage(value);
    if (key === 'tableDensity') setTableDensity(value);

    try {
      await api.auth.updateUser({
        data: {
          preferences: {
            ...user?.preferences,
            [key]: value
          }
        }
      });
      toast({ title: "Preference saved", duration: 1500 });
    } catch (error) {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(type);
    try {
      const result = type === 'excel' ? await exportToExcel() : await exportToPDF();
      if (result.success) {
        toast({ title: "Export successful", description: `Your ${type === 'excel' ? 'Excel' : 'PDF'} file has been downloaded.` });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      toast({ title: "Export failed", description: "Please try again later.", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="dark-mode" className="flex flex-col space-y-1">
                  <span>Dark Mode</span>
                  <span className="font-normal text-xs text-muted-foreground">Enable dark theme for the dashboard</span>
                </Label>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="w-4 h-4 text-muted-foreground" />
                <Label className="flex flex-col space-y-1">
                  <span>Table Density</span>
                  <span className="font-normal text-xs text-muted-foreground">Adjust the spacing of data tables</span>
                </Label>
              </div>
              <Select value={tableDensity} onValueChange={(v) => handlePreferenceUpdate('tableDensity', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select density" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Workflow */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow</CardTitle>
            <CardDescription>Streamline your daily tasks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Home className="w-4 h-4 text-muted-foreground" />
                <Label className="flex flex-col space-y-1">
                  <span>Default Start Page</span>
                  <span className="font-normal text-xs text-muted-foreground">Page to load after login</span>
                </Label>
              </div>
              <Select value={startPage} onValueChange={(v) => handlePreferenceUpdate('startPage', v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="volunteers">Volunteers</SelectItem>
                  <SelectItem value="applications">Applications</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export your data for backup or reporting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => handleExport('excel')} disabled={exporting === 'excel'}>
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <span className="font-medium">Export Data (Excel)</span>
                <span className="text-xs text-muted-foreground">Volunteers, Students, Apps</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => handleExport('pdf')} disabled={exporting === 'pdf'}>
                <FileText className="w-8 h-8 text-red-500" />
                <span className="font-medium">Export Report (PDF)</span>
                <span className="text-xs text-muted-foreground">Summary & Tables</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

