import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { addDays, nextSunday } from "date-fns";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.log("Missing Supabase env. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const users = [
  { email: "super@umeed.test", password: "Password123!", role: "super_admin", name: "Super Admin" },
  { email: "admin@umeed.test", password: "Password123!", role: "admin", name: "Admin User" },
  { email: "volunteer@umeed.test", password: "Password123!", role: "volunteer", name: "Volunteer User" },
];

const randomId = () => crypto.randomUUID();

const makeStudents = () =>
  [
    "Aarav Khan",
    "Sana Patel",
    "Ishaan Roy",
    "Meera Das",
    "Kabir Malhotra",
    "Riya Sharma",
    "Vivaan Iyer",
    "Ananya Gupta",
    "Aditya Verma",
    "Zara Shaikh",
  ].map((name, idx) => ({
    id: randomId(),
    name,
    gender: idx % 2 === 0 ? "Male" : "Female",
    class_grade: `${5 + (idx % 3)}th`,
    school_name: "UMEED Learning Centre",
    area: idx % 2 === 0 ? "Andheri" : "Bandra",
    status: "active",
    enrollment_date: "2024-01-15",
  }));

const makeSessions = () => {
  const thisSunday = nextSunday(new Date());
  return [
    { id: randomId(), date: addDays(thisSunday, -7).toISOString().split("T")[0], location: "Centre" },
    { id: randomId(), date: addDays(thisSunday, 0).toISOString().split("T")[0], location: "Centre" },
    { id: randomId(), date: addDays(thisSunday, 7).toISOString().split("T")[0], location: "Centre" },
  ];
};

async function main() {
  console.log("Seeding Supabase with demo data...");

  for (const user of users) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.name },
    });
    if (error) {
      console.warn("User seed skipped", user.email, error.message);
      continue;
    }
    await supabase.from("user_roles").upsert({ user_id: data.user?.id, role: user.role });
    await supabase
      .from("volunteers")
      .upsert({
        user_id: data.user?.id,
        name: user.name,
        email: user.email,
        status: "approved",
        availability: "Weekends",
        preferred_languages: "English, Hindi",
      });
  }

  const students = makeStudents();
  await supabase.from("students").upsert(students);

  const sessions = makeSessions();
  await supabase.from("sessions").upsert(sessions);

  const volunteerRows = await supabase.from("volunteers").select("id");
  const studentRows = await supabase.from("students").select("id");

  const volunteerList = volunteerRows.data || [];
  const studentList = studentRows.data || [];

  if (volunteerList.length && studentList.length) {
    const assignments = sessions.flatMap((session) =>
      studentList.slice(0, 6).map((student, idx) => ({
        id: randomId(),
        session_id: session.id,
        student_id: student.id,
        volunteer_id: volunteerList[idx % volunteerList.length].id,
      }))
    );
    await supabase.from("session_assignments").upsert(assignments);

    const attendance = sessions.flatMap((session) =>
      studentList.map((student) => ({
        id: randomId(),
        session_id: session.id,
        student_id: student.id,
        status: "present",
      }))
    );
    await supabase.from("student_attendance").upsert(attendance);
  }

  console.log("Seed completed. Demo credentials:");
  users.forEach((u) => console.log(`${u.role}: ${u.email} / ${u.password}`));
}

main();

