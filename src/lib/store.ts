// Temporary localStorage-based store. Replace with your DB calls.

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

const KEYS = {
  users: "att_users",
  subjects: "att_subjects",
  attendance: "att_attendance",
  currentUser: "att_current_user",
};

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function set<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed demo data
export function seedIfEmpty() {
  const users = get<User>(KEYS.users);
  if (users.length === 0) {
    const demoUsers: User[] = [
      { id: "t1", name: "Prof. Smith", email: "teacher@demo.com", role: "teacher" },
      { id: "s1", name: "Alice Johnson", email: "alice@demo.com", role: "student" },
      { id: "s2", name: "Bob Williams", email: "bob@demo.com", role: "student" },
      { id: "s3", name: "Charlie Brown", email: "charlie@demo.com", role: "student" },
      { id: "s4", name: "Diana Ross", email: "diana@demo.com", role: "student" },
      { id: "s5", name: "Edward Chen", email: "edward@demo.com", role: "student" },
    ];
    set(KEYS.users, demoUsers);

    const demoSubjects: Subject[] = [
      { id: "sub1", name: "Mathematics", teacherId: "t1" },
      { id: "sub2", name: "Physics", teacherId: "t1" },
      { id: "sub3", name: "Computer Science", teacherId: "t1" },
    ];
    set(KEYS.subjects, demoSubjects);
  }
}

// Auth
export function login(email: string, _password: string): User | null {
  const users = get<User>(KEYS.users);
  const user = users.find((u) => u.email === email);
  if (user) {
    localStorage.setItem(KEYS.currentUser, JSON.stringify(user));
  }
  return user || null;
}

export function logout() {
  localStorage.removeItem(KEYS.currentUser);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(KEYS.currentUser);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Subjects
export function getSubjects(teacherId?: string): Subject[] {
  const all = get<Subject>(KEYS.subjects);
  return teacherId ? all.filter((s) => s.teacherId === teacherId) : all;
}

export function addSubject(name: string, teacherId: string): Subject {
  const subjects = get<Subject>(KEYS.subjects);
  const newSub: Subject = { id: `sub_${Date.now()}`, name, teacherId };
  subjects.push(newSub);
  set(KEYS.subjects, subjects);
  return newSub;
}

export function deleteSubject(id: string) {
  set(KEYS.subjects, get<Subject>(KEYS.subjects).filter((s) => s.id !== id));
  // Also remove attendance for this subject
  set(KEYS.attendance, get<AttendanceRecord>(KEYS.attendance).filter((a) => a.subjectId !== id));
}

// Students
export function getStudents(): User[] {
  return get<User>(KEYS.users).filter((u) => u.role === "student");
}

export function addStudent(name: string, email: string): User {
  const users = get<User>(KEYS.users);
  const newStudent: User = { id: `s_${Date.now()}`, name, email, role: "student" };
  users.push(newStudent);
  set(KEYS.users, users);
  return newStudent;
}

export function deleteStudent(id: string) {
  set(KEYS.users, get<User>(KEYS.users).filter((u) => u.id !== id));
  set(KEYS.attendance, get<AttendanceRecord>(KEYS.attendance).filter((a) => a.studentId !== id));
}

// Attendance
export function getAttendance(subjectId?: string, studentId?: string): AttendanceRecord[] {
  let records = get<AttendanceRecord>(KEYS.attendance);
  if (subjectId) records = records.filter((r) => r.subjectId === subjectId);
  if (studentId) records = records.filter((r) => r.studentId === studentId);
  return records;
}

export function saveAttendance(subjectId: string, date: string, records: { studentId: string; present: boolean }[]) {
  const all = get<AttendanceRecord>(KEYS.attendance);
  // Remove existing records for this subject+date
  const filtered = all.filter((r) => !(r.subjectId === subjectId && r.date === date));
  const newRecords = records.map((r) => ({
    id: `att_${Date.now()}_${r.studentId}`,
    subjectId,
    date,
    studentId: r.studentId,
    present: r.present,
  }));
  set(KEYS.attendance, [...filtered, ...newRecords]);
}
