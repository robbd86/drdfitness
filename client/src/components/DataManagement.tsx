import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Upload, Trash2, FileJson, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function DataManagement() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/data/export");
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drd-fitness-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: "Your workout data has been downloaded as JSON." });
    } catch {
      toast({ title: "Export Failed", description: "Could not export your data.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/data/export");
      const data = await response.json();
      
      const rows: string[] = ["Workout,Day,Exercise,Set Number,Reps,Weight (KG),Completed,Notes"];
      
      for (const workout of data.workouts) {
        for (const day of workout.days || []) {
          for (const exercise of day.exercises || []) {
            if (exercise.setData && exercise.setData.length > 0) {
              for (let i = 0; i < exercise.setData.length; i++) {
                const set = exercise.setData[i];
                const row = [
                  `"${workout.name.replace(/"/g, '""')}"`,
                  `"${day.name.replace(/"/g, '""')}"`,
                  `"${exercise.name.replace(/"/g, '""')}"`,
                  i + 1,
                  set.reps || exercise.reps,
                  set.weight || 0,
                  set.completed ? "Yes" : "No",
                  `"${(exercise.notes || '').replace(/"/g, '""')}"`
                ].join(",");
                rows.push(row);
              }
            } else {
              for (let i = 0; i < exercise.sets; i++) {
                const row = [
                  `"${workout.name.replace(/"/g, '""')}"`,
                  `"${day.name.replace(/"/g, '""')}"`,
                  `"${exercise.name.replace(/"/g, '""')}"`,
                  i + 1,
                  exercise.reps,
                  exercise.weight || 0,
                  "No",
                  `"${(exercise.notes || '').replace(/"/g, '""')}"`
                ].join(",");
                rows.push(row);
              }
            }
          }
        }
      }

      const blob = new Blob([rows.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drd-fitness-backup-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Export Complete", description: "Your workout data has been downloaded as CSV." });
    } catch {
      toast({ title: "Export Failed", description: "Could not export your data.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.workouts || !Array.isArray(data.workouts)) {
        throw new Error("Invalid file format");
      }

      setPendingImportData(data);
      setShowImportDialog(true);
    } catch {
      toast({ title: "Import Failed", description: "Invalid file format. Please use a JSON file exported from this app.", variant: "destructive" });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImport = async (replaceExisting: boolean) => {
    if (!pendingImportData) return;
    
    setIsImporting(true);
    setShowImportDialog(false);
    try {
      await apiRequest("POST", "/api/data/import", { 
        ...pendingImportData, 
        replaceExisting 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Import Complete", description: `Imported ${pendingImportData.workouts.length} workout(s) successfully.` });
    } catch {
      toast({ title: "Import Failed", description: "Could not import the data.", variant: "destructive" });
    } finally {
      setIsImporting(false);
      setPendingImportData(null);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await apiRequest("DELETE", "/api/data/reset");
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Reset Complete", description: "All workout data has been deleted." });
    } catch {
      toast({ title: "Reset Failed", description: "Could not reset your data.", variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Data Management</CardTitle>
        <CardDescription>Export, import, or reset your workout data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            disabled={isExporting}
            data-testid="button-export-json"
          >
            <FileJson className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export JSON"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting}
            data-testid="button-export-csv"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-import-file"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            data-testid="button-import"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? "Importing..." : "Import JSON"}
          </Button>
        </div>

        <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Import Workout Data</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingImportData && `Found ${pendingImportData.workouts.length} workout(s) to import. `}
                Would you like to replace all existing data or add to it?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
              <AlertDialogCancel data-testid="button-cancel-import">Cancel</AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => handleImport(false)}
                data-testid="button-import-add"
              >
                Add to Existing
              </Button>
              <Button
                variant="default"
                onClick={() => handleImport(true)}
                data-testid="button-import-replace"
              >
                Replace All
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="pt-2 border-t border-border/30">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isResetting}
                data-testid="button-reset-data"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isResetting ? "Resetting..." : "Reset All Data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete all your workouts, days, and exercises from the database.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-reset">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-reset"
                >
                  Yes, delete everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
