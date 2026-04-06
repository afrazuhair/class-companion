import { apiFetch } from "@/lib/api";

export type Role = "teacher" | "student";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
}

function createQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.append(key, value);
  });
  const string = query.toString();
  return string ? `?${string}` : "";
}

export async function getSubjects(teacherId?: string): Promise<Subject[]> {
  return apiFetch<Subject[]>(`/subjects${createQuery({ teacherId })}`);
}

export async function addSubject(name: string, teacherId: string): Promise<Subject> {
  return apiFetch<Subject>("/subjects", {
    method: "POST",
    body: JSON.stringify({ name, teacherId }),
  });
}

export async function deleteSubject(id: string): Promise<void> {
  await apiFetch<void>(`/subjects/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getStudents(): Promise<User[]> {
  return apiFetch<User[]>("/students");
}

export async function addStudent(name: string, email: string): Promise<User> {
  return apiFetch<User>("/students", {
    method: "POST",
    body: JSON.stringify({ name, email }),
  });
}

export async function deleteStudent(id: string): Promise<void> {
  await apiFetch<void>(`/students/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getAttendance(subjectId?: string, studentId?: string): Promise<AttendanceRecord[]> {
  return apiFetch<AttendanceRecord[]>(`/attendance${createQuery({ subjectId, studentId })}`);
}

export async function saveAttendance(subjectId: string, date: string, records: { studentId: string; present: boolean }[]): Promise<void> {
  await apiFetch<void>("/attendance", {
    method: "POST",
    body: JSON.stringify({ subjectId, date, records }),
  });
}
