/**
 * Database Seed Script
 * 
 * Creates default users and sample data for the Umeed application.
 * Run with: npm run seed
 */

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'umeed.db');
const SCHEMA_PATH = join(__dirname, '..', 'src', 'lib', 'schema.sql');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema
console.log('📦 Initializing database schema...');
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);
console.log('✅ Schema initialized');

// Hash function
async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

// Seed function
async function seed() {
    console.log('🌱 Seeding database...');

    // Clear existing data
    const tables = [
        'session_rsvps', 'volunteer_attendance', 'student_attendance',
        'session_assignments', 'session_mappings', 'event_media', 'media',
        'sessions', 'events', 'notices', 'volunteer_applications',
        'contact_messages', 'donations', 'user_roles', 'volunteers',
        'students', 'profiles', 'users', 'app_settings'
    ];

    for (const table of tables) {
        try {
            db.exec(`DELETE FROM ${table}`);
        } catch (e) {
            // Table might not exist yet
        }
    }
    console.log('🗑️  Cleared existing data');

    // Create Super Admin
    const superAdminId = uuidv4();
    const superAdminHash = await hashPassword('super123');
    db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
    VALUES (?, 'super@umeed.test', ?, 'Super Administrator', 'super_admin', datetime('now'), datetime('now'))
  `).run(superAdminId, superAdminHash);

    db.prepare(`
    INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
    VALUES (?, ?, 'super@umeed.test', 'Super Administrator', 'super_admin', datetime('now'), datetime('now'))
  `).run(uuidv4(), superAdminId);

    db.prepare(`
    INSERT INTO user_roles (id, user_id, role, created_at)
    VALUES (?, ?, 'super_admin', datetime('now'))
  `).run(uuidv4(), superAdminId);

    console.log('👑 Created super admin: super@umeed.test / super123');

    // Create Admin
    const adminId = uuidv4();
    const adminHash = await hashPassword('admin123');
    db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
    VALUES (?, 'admin@umeed.test', ?, 'Admin User', 'admin', datetime('now'), datetime('now'))
  `).run(adminId, adminHash);

    db.prepare(`
    INSERT INTO profiles (id, user_id, email, full_name, role, created_at, updated_at)
    VALUES (?, ?, 'admin@umeed.test', 'Admin User', 'admin', datetime('now'), datetime('now'))
  `).run(uuidv4(), adminId);

    db.prepare(`
    INSERT INTO user_roles (id, user_id, role, created_at)
    VALUES (?, ?, 'admin', datetime('now'))
  `).run(uuidv4(), adminId);

    const adminVolunteerId = uuidv4();
    db.prepare(`
    INSERT INTO volunteers (id, user_id, name, email, phone, status, joined_at, created_at, updated_at)
    VALUES (?, ?, 'Admin User', 'admin@umeed.test', '+91 98765 43210', 'approved', datetime('now'), datetime('now'), datetime('now'))
  `).run(adminVolunteerId, adminId);

    console.log('🔑 Created admin: admin@umeed.test / admin123');

    // Create Volunteers
    const volunteers = [
        { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91 98765 43211', status: 'approved', skills: 'Mathematics, Physics' },
        { name: 'Priya Patel', email: 'priya@example.com', phone: '+91 98765 43212', status: 'approved', skills: 'English, Science' },
        { name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 98765 43213', status: 'pending', skills: 'Hindi, Social Studies' },
    ];

    for (const v of volunteers) {
        const id = uuidv4();
        const hash = await hashPassword('volunteer123');
        const userId = uuidv4();

        db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'volunteer', datetime('now'), datetime('now'))
    `).run(userId, v.email, hash, v.name);

        db.prepare(`
      INSERT INTO volunteers (id, user_id, name, email, phone, status, skills, joined_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `).run(id, userId, v.name, v.email, v.phone, v.status, v.skills);
    }
    console.log(`👥 Created ${volunteers.length} sample volunteers`);

    // Create Students
    const students = [
        { name: 'Arjun Singh', gender: 'Male', class_grade: '5', school_name: 'Model School', status: 'active' },
        { name: 'Sneha Verma', gender: 'Female', class_grade: '6', school_name: 'City Public School', status: 'active' },
        { name: 'Ravi Kumar', gender: 'Male', class_grade: '4', school_name: 'Model School', status: 'active' },
        { name: 'Ananya Gupta', gender: 'Female', class_grade: '5', school_name: 'DAV School', status: 'active' },
        { name: 'Vikram Yadav', gender: 'Male', class_grade: '7', school_name: 'City Public School', status: 'inactive' },
    ];

    for (const s of students) {
        db.prepare(`
      INSERT INTO students (id, full_name, name, gender, class_grade, school_name, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(uuidv4(), s.name, s.name, s.gender, s.class_grade, s.school_name, s.status);
    }
    console.log(`📚 Created ${students.length} sample students`);

    // Create Sessions
    const today = new Date();
    const sessions = [
        { title: 'Morning Math Class', date: today.toISOString().split('T')[0], start_time: '09:00', end_time: '10:30', location: 'Community Center' },
        { title: 'English Reading Session', date: new Date(today.getTime() + 86400000).toISOString().split('T')[0], start_time: '14:00', end_time: '15:30', location: 'Library Hall' },
        { title: 'Science Workshop', date: new Date(today.getTime() + 172800000).toISOString().split('T')[0], start_time: '10:00', end_time: '12:00', location: 'Science Lab' },
    ];

    for (const s of sessions) {
        db.prepare(`
      INSERT INTO sessions (id, title, date, session_date, start_time, end_time, location, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(uuidv4(), s.title, s.date, s.date, s.start_time, s.end_time, s.location);
    }
    console.log(`📅 Created ${sessions.length} sample sessions`);

    // Create Events
    const events = [
        { title: 'Annual Day Celebration', description: 'Annual cultural program', date: '2024-03-15', location: 'Community Hall' },
        { title: 'Sports Day', description: 'Inter-school sports competition', date: '2024-04-20', location: 'Sports Ground' },
    ];

    for (const e of events) {
        db.prepare(`
      INSERT INTO events (id, title, description, date, event_date, location, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(uuidv4(), e.title, e.description, e.date, e.date, e.location);
    }
    console.log(`🎉 Created ${events.length} sample events`);

    // Create Notices
    const notices = [
        { title: 'Welcome to Umeed!', description: 'Welcome to the new academic year. We are excited to have you join us.', visibility: 'public' },
        { title: 'Volunteer Meeting', description: 'All volunteers are requested to attend the monthly meeting on Sunday.', visibility: 'internal' },
    ];

    for (const n of notices) {
        db.prepare(`
      INSERT INTO notices (id, title, description, visibility, published_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
    `).run(uuidv4(), n.title, n.description, n.visibility);
    }
    console.log(`📢 Created ${notices.length} sample notices`);

    // Create App Settings
    db.prepare(`
    INSERT INTO app_settings (id, key, value, created_at, updated_at)
    VALUES (?, 'official_email', 'admin@umeed.org', datetime('now'), datetime('now'))
  `).run(uuidv4());
    console.log('⚙️  Created app settings');

    console.log('\n✨ Database seeding complete!\n');
    console.log('Default credentials:');
    console.log('  Super Admin: super@umeed.test / super123');
    console.log('  Admin:       admin@umeed.test / admin123');
    console.log('  Volunteers:  [email]@example.com / volunteer123\n');
}

seed().then(() => {
    db.close();
    process.exit(0);
}).catch((err) => {
    console.error('❌ Seed failed:', err);
    db.close();
    process.exit(1);
});
