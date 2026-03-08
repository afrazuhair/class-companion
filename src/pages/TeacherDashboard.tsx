import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUser, getSubjects, addSubject, deleteSubject, getStudents, getAttendance, saveAttendance, type Subject, type User } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, BookOpen, Users, CalendarCheck } from "lucide-react";
import { format } from "date-fns";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});
  const [students, setStudents] = useState<User[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "teacher") { navigate("/"); return; }
    refreshData();
  }, []);

  const refreshData = () => {
    const user = getCurrentUser();
    if (!user) return;
    setSubjects(getSubjects(user.id));
    setStudents(getStudents());
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim() || !user) return;
    addSubject(newSubjectName.trim(), user.id);
    setNewSubjectName("");
    setDialogOpen(false);
    refreshData();
  };

  const handleDeleteSubject = (id: string) => {
    deleteSubject(id);
    if (selectedSubject === id) setSelectedSubject(null);
    refreshData();
  };

  const loadAttendance = (subjectId: string, date: string) => {
    setSelectedSubject(subjectId);
    setAttendanceDate(date);
    const records = getAttendance(subjectId);
    const map: Record<string, boolean> = {};
    students.forEach((s) => { map[s.id] = true; }); // default present
    records.filter((r) => r.date === date).forEach((r) => { map[r.studentId] = r.present; });
    setAttendanceMap(map);
  };

  const handleSaveAttendance = () => {
    if (!selectedSubject) return;
    const records = students.map((s) => ({ studentId: s.id, present: attendanceMap[s.id] ?? true }));
    saveAttendance(selectedSubject, attendanceDate, records);
  };

  const totalAttendance = subjects.reduce((acc, sub) => acc + getAttendance(sub.id).length, 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 space-y-8">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div><p className="text-2xl font-bold text-foreground">{subjects.length}</p><p className="text-sm text-muted-foreground">Subjects</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div><p className="text-2xl font-bold text-foreground">{students.length}</p><p className="text-sm text-muted-foreground">Students</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CalendarCheck className="h-6 w-6 text-success" />
              </div>
              <div><p className="text-2xl font-bold text-foreground">{totalAttendance}</p><p className="text-sm text-muted-foreground">Records</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subjects">
          <TabsList>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Your Subjects</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" /> Add Subject</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Subject</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Subject Name</Label>
                      <Input placeholder="e.g., Mathematics" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddSubject()} />
                    </div>
                    <Button onClick={handleAddSubject} className="w-full">Add Subject</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((sub) => {
                const records = getAttendance(sub.id);
                const uniqueDates = new Set(records.map((r) => r.date)).size;
                return (
                  <Card key={sub.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{sub.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSubject(sub.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>{uniqueDates} sessions recorded</CardDescription>
                    </CardHeader>
                  </Card>
                );
              })}
              {subjects.length === 0 && (
                <p className="text-muted-foreground col-span-full text-center py-12">No subjects yet. Add your first subject to get started.</p>
              )}
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Select a subject and date, then mark student attendance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" value={selectedSubject || ""} onChange={(e) => { if (e.target.value) loadAttendance(e.target.value, attendanceDate); }}>
                      <option value="">Select subject...</option>
                      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={attendanceDate} onChange={(e) => { setAttendanceDate(e.target.value); if (selectedSubject) loadAttendance(selectedSubject, e.target.value); }} />
                  </div>
                </div>

                {selectedSubject && (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-center">Present</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-muted-foreground">{s.email}</TableCell>
                            <TableCell className="text-center">
                              <Checkbox checked={attendanceMap[s.id] ?? true} onCheckedChange={(checked) => setAttendanceMap((prev) => ({ ...prev, [s.id]: !!checked }))} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Button onClick={handleSaveAttendance} className="w-full">Save Attendance</Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TeacherDashboard;
