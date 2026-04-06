import { db } from "@/integrations/firebase/config";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

export interface Subject {
  id: string;
  name: string;
  teacherId: string;
  createdAt: Date;
}

export interface AttendanceRecord {
  id: string;
  subjectId: string;
  studentId: string;
  date: string;
  present: boolean;
  createdAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  createdAt: Date;
}

// Users
export const userStore = {
  async getAll(): Promise<User[]> {
    const snapshot = await getDocs(collection(db, "users"));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  },

  async getByRole(role: "teacher" | "student"): Promise<User[]> {
    const q = query(collection(db, "users"), where("role", "==", role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "users", id));
  },
};

// Subjects
export const subjectStore = {
  async create(name: string, teacherId: string): Promise<Subject> {
    const docRef = await addDoc(collection(db, "subjects"), {
      name,
      teacherId,
      createdAt: new Date(),
    });
    return { id: docRef.id, name, teacherId, createdAt: new Date() };
  },

  async getByTeacher(teacherId: string): Promise<Subject[]> {
    const q = query(collection(db, "subjects"), where("teacherId", "==", teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Subject));
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, "subjects", id));
  },
};

// Attendance
export const attendanceStore = {
  async record(subjectId: string, date: string, records: { studentId: string; present: boolean }[]): Promise<void> {
    const batch = writeBatch(db);

    // Delete existing records for this date
    const q = query(
      collection(db, "attendance"),
      where("subjectId", "==", subjectId),
      where("date", "==", date)
    );
    const existing = await getDocs(q);
    existing.docs.forEach((doc) => batch.delete(doc.ref));

    // Add new records
    records.forEach((record) => {
      const docRef = doc(collection(db, "attendance"));
      batch.set(docRef, {
        subjectId,
        studentId: record.studentId,
        date,
        present: record.present,
        createdAt: new Date(),
      });
    });

    await batch.commit();
  },

  async getBySubject(subjectId: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, "attendance"), where("subjectId", "==", subjectId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },

  async getByStudent(studentId: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, "attendance"), where("studentId", "==", studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AttendanceRecord));
  },
};

// Alerts
export const alertStore = {
  async send(students: { id: string; name: string; email: string }[]): Promise<void> {
    await addDoc(collection(db, "alerts"), {
      students,
      createdAt: new Date(),
      status: "sent",
    });
    console.log(`Attendance alert sent to ${students.length} students`);
  },
};
