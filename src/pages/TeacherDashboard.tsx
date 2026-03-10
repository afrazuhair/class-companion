import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getCurrentUser, getSubjects, addSubject, deleteSubject, getStudents, addStudent, deleteStudent, getAttendance, saveAttendance, type Subject, type User } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, BookOpen, Users, CalendarCheck, UserPlus, BarChart3, Download, Mail } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

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
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [reportSubject, setReportSubject] = useState<string>("all");

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
    toast.success("Subject added!");
  };

  const handleDeleteSubject = (id: string) => {
    deleteSubject(id);
    if (selectedSubject === id) setSelectedSubject(null);
    refreshData();
    toast.success("Subject deleted.");
  };

  const handleAddStudent = () => {
    if (!newStudentName.trim() || !newStudentEmail.trim()) return;
    addStudent(newStudentName.trim(), newStudentEmail.trim());
    setNewStudentName("");
    setNewStudentEmail("");
    setStudentDialogOpen(false);
    refreshData();
    toast.success("Student added!");
  };

  const handleDeleteStudent = (id: string) => {
    deleteStudent(id);
    refreshData();
    toast.success("Student removed.");
  };

  const loadAttendance = (subjectId: string, date: string) => {
    setSelectedSubject(subjectId);
    setAttendanceDate(date);
    const records = getAttendance(subjectId);
    const map: Record<string, boolean> = {};
    students.forEach((s) => { map[s.id] = true; });
    records.filter((r) => r.date === date).forEach((r) => { map[r.studentId] = r.present; });
    setAttendanceMap(map);
  };

  const handleSaveAttendance = () => {
    if (!selectedSubject) return;
    const records = students.map((s) => ({ studentId: s.id, present: attendanceMap[s.id] ?? true }));
    saveAttendance(selectedSubject, attendanceDate, records);
    refreshData();
    toast.success("Attendance saved successfully!");
  };

  const getStudentStats = (studentId: string, subjectId?: string) => {
    const records = getAttendance(subjectId, studentId);
    const total = records.length;
    const present = records.filter((r) => r.present).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent: total - present, percentage };
  };

  const totalAttendance = subjects.reduce((acc, sub) => acc + getAttendance(sub.id).length, 0);

  const handleExportExcel = () => {
    const rows: Record<string, string | number>[] = [];
    const filteredStudents = students;
    const filteredSubjects = reportSubject === "all" ? subjects : subjects.filter(s => s.id === reportSubject);

    filteredStudents.forEach((student) => {
      const row: Record<string, string | number> = { Name: student.name, Email: student.email };
      filteredSubjects.forEach((sub) => {
        const stats = getStudentStats(student.id, sub.id);
        row[`${sub.name} (Present)`] = stats.present;
        row[`${sub.name} (Total)`] = stats.total;
        row[`${sub.name} (%)`] = stats.percentage;
      });
      const overall = getStudentStats(student.id, reportSubject === "all" ? undefined : reportSubject);
      row["Overall %"] = overall.percentage;
      rows.push(row);
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
    XLSX.writeFile(wb, `attendance_report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Report exported!");
  };

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
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
            <TabsTrigger value="reports">Student Reports</TabsTrigger>
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
                  <DialogHeader>
                    <DialogTitle>Add New Subject</DialogTitle>
                    <DialogDescription>Enter the name of the subject you want to add.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
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

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Manage Students</h2>
              <Dialog open={studentDialogOpen} onOpenChange={setStudentDialogOpen}>
                <DialogTrigger asChild>
                  <Button><UserPlus className="h-4 w-4 mr-1" /> Add Student</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Enter the student's name and email to add them.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input placeholder="e.g., John Doe" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" placeholder="e.g., john@example.com" value={newStudentEmail} onChange={(e) => setNewStudentEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddStudent()} />
                    </div>
                    <Button onClick={handleAddStudent} className="w-full">Add Student</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="pt-6">
                {students.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No students yet. Add your first student.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Overall %</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => {
                        const overall = getStudentStats(s.id);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.name}</TableCell>
                            <TableCell className="text-muted-foreground">{s.email}</TableCell>
                            <TableCell className="text-center">
                              {overall.total > 0 ? (
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${overall.percentage >= 75 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                  {overall.percentage}%
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteStudent(s.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
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

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Student Reports</CardTitle>
                    <CardDescription>View attendance breakdown for every student</CardDescription>
                  </div>
                   <div className="flex items-end gap-2">
                     <div className="space-y-1">
                       <Label className="text-xs">Filter by Subject</Label>
                       <select className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground" value={reportSubject} onChange={(e) => setReportSubject(e.target.value)}>
                         <option value="all">All Subjects</option>
                         {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                     </div>
                     <Button variant="outline" size="sm" onClick={handleExportExcel}><Download className="h-4 w-4 mr-1" /> Export</Button>
                   </div>
                </div>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No students to show.</p>
                ) : (
                  <div className="space-y-6">
                    {students.map((student) => {
                      if (reportSubject === "all") {
                        const overall = getStudentStats(student.id);
                        return (
                          <div key={student.id} className="rounded-lg border border-border p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-foreground">{student.name}</p>
                                <p className="text-sm text-muted-foreground">{student.email}</p>
                              </div>
                              <span className={`text-lg font-bold ${overall.percentage >= 75 ? "text-success" : overall.percentage > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {overall.total > 0 ? `${overall.percentage}%` : "—"}
                              </span>
                            </div>
                            {subjects.map((sub) => {
                              const stats = getStudentStats(student.id, sub.id);
                              if (stats.total === 0) return null;
                              return (
                                <div key={sub.id} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{sub.name}</span>
                                    <span className="text-foreground">{stats.present}/{stats.total} ({stats.percentage}%)</span>
                                  </div>
                                  <Progress value={stats.percentage} className="h-1.5" />
                                </div>
                              );
                            })}
                            {subjects.every((sub) => getStudentStats(student.id, sub.id).total === 0) && (
                              <p className="text-sm text-muted-foreground">No attendance records yet.</p>
                            )}
                          </div>
                        );
                      } else {
                        const stats = getStudentStats(student.id, reportSubject);
                        return (
                          <div key={student.id} className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{stats.present}/{stats.total} present</p>
                            </div>
                            <div className="flex-1">
                              <Progress value={stats.percentage} className="h-2" />
                            </div>
                            <span className={`text-sm font-semibold w-12 text-right ${stats.percentage >= 75 ? "text-success" : stats.total > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                              {stats.total > 0 ? `${stats.percentage}%` : "—"}
                            </span>
                          </div>
                        );
                      }
                    })}
                  </div>
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
