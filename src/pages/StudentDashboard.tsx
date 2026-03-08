import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getSubjects, getAttendance, getStudents, type Subject, type AttendanceRecord } from "@/lib/store";
import AppHeader from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarCheck, CalendarX, Percent } from "lucide-react";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [myAttendance, setMyAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    if (!user || user.role !== "student") { navigate("/"); return; }
    setSubjects(getSubjects());
    setMyAttendance(getAttendance(undefined, user.id));
  }, []);

  const getStats = (subjectId: string) => {
    const records = myAttendance.filter((r) => r.subjectId === subjectId);
    const total = records.length;
    const present = records.filter((r) => r.present).length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent: total - present, percentage };
  };

  const overallTotal = myAttendance.length;
  const overallPresent = myAttendance.filter((r) => r.present).length;
  const overallPercentage = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <CalendarCheck className="h-6 w-6 text-success" />
              </div>
              <div><p className="text-2xl font-bold text-foreground">{overallPresent}</p><p className="text-sm text-muted-foreground">Days Present</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                <CalendarX className="h-6 w-6 text-destructive" />
              </div>
              <div><p className="text-2xl font-bold text-foreground">{overallTotal - overallPresent}</p><p className="text-sm text-muted-foreground">Days Absent</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Percent className="h-6 w-6 text-primary" />
              </div>
              <div><p className="text-2xl font-bold text-foreground">{overallPercentage}%</p><p className="text-sm text-muted-foreground">Overall Attendance</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise */}
        <Card>
          <CardHeader>
            <CardTitle>Subject-wise Attendance</CardTitle>
            <CardDescription>Your attendance breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No subjects available yet.</p>
            ) : (
              <div className="space-y-6">
                {subjects.map((sub) => {
                  const stats = getStats(sub.id);
                  return (
                    <div key={sub.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-foreground">{sub.name}</span>
                        <span className="text-sm text-muted-foreground">{stats.present}/{stats.total} ({stats.percentage}%)</span>
                      </div>
                      <Progress value={stats.percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Records */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Records</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={subjects[0]?.id}>
              <TabsList className="flex-wrap h-auto gap-1">
                {subjects.map((s) => <TabsTrigger key={s.id} value={s.id}>{s.name}</TabsTrigger>)}
              </TabsList>
              {subjects.map((sub) => {
                const records = myAttendance.filter((r) => r.subjectId === sub.id).sort((a, b) => b.date.localeCompare(a.date));
                return (
                  <TabsContent key={sub.id} value={sub.id}>
                    {records.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No attendance records yet.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {records.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.date}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${r.present ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                                  {r.present ? "Present" : "Absent"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StudentDashboard;
