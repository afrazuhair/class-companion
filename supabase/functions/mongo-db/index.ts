// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient, Bson } from "https://deno.land/x/mongo@v0.32.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Subject {
  _id?: Bson.ObjectId;
  id: string;
  name: string;
  teacherId: string;
}

interface User {
  _id?: Bson.ObjectId;
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
}

interface AttendanceRecord {
  _id?: Bson.ObjectId;
  id: string;
  subjectId: string;
  studentId: string;
  date: string;
  present: boolean;
}

type DBAction =
  | 'fetchSubjects'
  | 'addSubject'
  | 'deleteSubject'
  | 'fetchStudents'
  | 'addStudent'
  | 'deleteStudent'
  | 'fetchAttendance'
  | 'saveAttendance';

interface DBRequest {
  action: DBAction;
  payload?: unknown;
}

const mongoClient = new MongoClient();
let db: ReturnType<typeof mongoClient.database> | null = null;

async function getDatabase() {
  if (db) return db;

  const mongoUrl = Deno.env.get('MONGO_URL');
  if (!mongoUrl) {
    throw new Error('Missing MONGO_URL');
  }

  const parsedUrl = new URL(mongoUrl);
  const dbName = parsedUrl.pathname.replace(/^\//, '') || 'class_companion';

  await mongoClient.connect(mongoUrl);
  db = mongoClient.database(dbName);
  return db;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const json = await req.json() as DBRequest;
    const { action, payload } = json;
    const database = await getDatabase();
    const subjects = database.collection<Subject>('subjects');
    const students = database.collection<User>('students');
    const attendance = database.collection<AttendanceRecord>('attendance');

    switch (action) {
      case 'fetchSubjects': {
        const { teacherId } = payload as { teacherId?: string };
        const query = teacherId ? { teacherId } : {};
        const results = await subjects.find(query).toArray();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'addSubject': {
        const { name, teacherId } = payload as { name: string; teacherId: string };
        const newSubject: Subject = {
          id: `sub_${crypto.randomUUID()}`,
          name,
          teacherId,
        };
        await subjects.insertOne(newSubject);
        return new Response(JSON.stringify(newSubject), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'deleteSubject': {
        const { id } = payload as { id: string };
        await subjects.deleteOne({ id });
        await attendance.deleteMany({ subjectId: id });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'fetchStudents': {
        const results = await students.find({ role: 'student' }).toArray();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'addStudent': {
        const { name, email } = payload as { name: string; email: string };
        const newStudent: User = {
          id: `s_${crypto.randomUUID()}`,
          name,
          email,
          role: 'student',
        };
        await students.insertOne(newStudent);
        return new Response(JSON.stringify(newStudent), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'deleteStudent': {
        const { id } = payload as { id: string };
        await students.deleteOne({ id });
        await attendance.deleteMany({ studentId: id });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'fetchAttendance': {
        const { subjectId, studentId } = payload as { subjectId?: string; studentId?: string };
        const query: Record<string, unknown> = {};
        if (subjectId) query.subjectId = subjectId;
        if (studentId) query.studentId = studentId;
        const results = await attendance.find(query).toArray();
        return new Response(JSON.stringify(results), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'saveAttendance': {
        const { subjectId, date, records } = payload as {
          subjectId: string;
          date: string;
          records: { studentId: string; present: boolean }[];
        };
        await attendance.deleteMany({ subjectId, date });
        const newRecords = records.map((record) => ({
          id: `att_${crypto.randomUUID()}`,
          subjectId,
          studentId: record.studentId,
          date,
          present: record.present,
        }));
        if (newRecords.length > 0) {
          await attendance.insertMany(newRecords);
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error: unknown) {
    console.error('MongoDB function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
