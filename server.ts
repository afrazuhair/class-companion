import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { createHash, randomUUID } from "crypto";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DB_NAME = process.env.MONGO_DB_NAME || "class_companion";

if (!MONGO_URL) {
  throw new Error("MONGO_URL is required in environment variables");
}

const client = new MongoClient(MONGO_URL);
await client.connect();
const db = client.db(DB_NAME);
const users = db.collection("users");
const subjects = db.collection("subjects");
const attendance = db.collection("attendance");

const app = express();
app.use(cors());
app.use(express.json());

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function toPublicUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

app.post("/api/auth/signup", async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing signup fields" });
  }

  const existing = await users.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const newUser = {
    id: `user_${randomUUID()}`,
    name,
    email,
    role,
    passwordHash: hashPassword(password),
    createdAt: new Date(),
  };

  await users.insertOne(newUser);
  return res.status(201).json({ profile: toPublicUser(newUser) });
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: "Missing login fields" });
  }

  const user = await users.findOne({ email });
  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  return res.status(200).json({ profile: toPublicUser(user) });
});

app.get("/api/subjects", async (req: Request, res: Response) => {
  const teacherId = req.query.teacherId as string | undefined;
  const query = teacherId ? { teacherId } : {};
  const results = await subjects.find(query).toArray();
  return res.status(200).json(results);
});

app.post("/api/subjects", async (req: Request, res: Response) => {
  const { name, teacherId } = req.body as { name?: string; teacherId?: string };
  if (!name || !teacherId) {
    return res.status(400).json({ error: "Missing subject fields" });
  }

  const newSubject = {
    id: `sub_${randomUUID()}`,
    name,
    teacherId,
    createdAt: new Date(),
  };
  await subjects.insertOne(newSubject);
  return res.status(201).json(newSubject);
});

app.delete("/api/subjects/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  await subjects.deleteOne({ id });
  await attendance.deleteMany({ subjectId: id });
  return res.status(200).json({ success: true });
});

app.get("/api/students", async (_req: Request, res: Response) => {
  const results = await users.find({ role: "student" }).toArray();
  return res.status(200).json(results.map(toPublicUser));
});

app.post("/api/students", async (req: Request, res: Response) => {
  const { name, email } = req.body as { name?: string; email?: string };
  if (!name || !email) {
    return res.status(400).json({ error: "Missing student fields" });
  }

  const existing = await users.findOne({ email });
  if (existing) {
    return res.status(400).json({ error: "Email already exists" });
  }

  const newStudent = {
    id: `user_${randomUUID()}`,
    name,
    email,
    role: "student",
    passwordHash: "",
    createdAt: new Date(),
  };
  await users.insertOne(newStudent);
  return res.status(201).json(toPublicUser(newStudent));
});

app.delete("/api/students/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  await users.deleteOne({ id });
  await attendance.deleteMany({ studentId: id });
  return res.status(200).json({ success: true });
});

app.get("/api/attendance", async (req: Request, res: Response) => {
  const subjectId = req.query.subjectId as string | undefined;
  const studentId = req.query.studentId as string | undefined;
  const query: Record<string, unknown> = {};
  if (subjectId) query.subjectId = subjectId;
  if (studentId) query.studentId = studentId;
  const results = await attendance.find(query).toArray();
  return res.status(200).json(results);
});

app.post("/api/attendance", async (req: Request, res: Response) => {
  const { subjectId, date, records } = req.body as {
    subjectId?: string;
    date?: string;
    records?: { studentId: string; present: boolean }[];
  };
  if (!subjectId || !date || !Array.isArray(records)) {
    return res.status(400).json({ error: "Missing attendance payload" });
  }
  await attendance.deleteMany({ subjectId, date });
  const newRecords = records.map((record) => ({
    id: `att_${randomUUID()}`,
    subjectId,
    studentId: record.studentId,
    date,
    present: record.present,
    createdAt: new Date(),
  }));
  if (newRecords.length > 0) {
    await attendance.insertMany(newRecords);
  }
  return res.status(200).json({ success: true });
});

app.post("/api/alerts", async (req: Request, res: Response) => {
  const { students: lowAttendanceStudents } = req.body as { students?: unknown };
  if (!Array.isArray(lowAttendanceStudents)) {
    return res.status(400).json({ error: "Missing students payload" });
  }
  console.log("Attendance alerts:", JSON.stringify(lowAttendanceStudents, null, 2));
  return res.status(200).json({ count: lowAttendanceStudents.length });
});

app.listen(PORT, () => {
  console.log(`MongoDB API server listening on http://localhost:${PORT}`);
});
