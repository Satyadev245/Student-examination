import initSqlJs, { type Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let dbInstance: Database | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'datapro.sqlite');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads', 'examinations');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
      return dbInstance;
    } catch (e) {
      console.error('Failed to load existing database, recreating new one:', e);
    }
  }

  dbInstance = new SQL.Database();
  await initSchemaAndSeed(dbInstance);
  saveDb();
  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

// Helper query wrappers
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function execute(sql: string, params: any[] = []): { lastInsertRowId?: number; changes?: number } {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  const info = queryOne<{ id: number; changes: number }>('SELECT last_insert_rowid() as id, changes() as changes');
  saveDb();
  return {
    lastInsertRowId: info?.id,
    changes: info?.changes
  };
}

async function initSchemaAndSeed(db: Database) {
  // Create tables according to Section 15 Database Design
  db.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      mobile TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_name TEXT NOT NULL,
      course_code TEXT UNIQUE NOT NULL,
      description TEXT,
      duration TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_name TEXT NOT NULL,
      batch_code TEXT UNIQUE NOT NULL,
      course_id INTEGER NOT NULL,
      trainer_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      timing TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (trainer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS trainer_course_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trainer_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(trainer_id, course_id),
      FOREIGN KEY (trainer_id) REFERENCES users(id),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      mobile TEXT NOT NULL,
      course_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      joining_date DATE NOT NULL,
      status TEXT DEFAULT 'ACTIVE',
      address TEXT,
      registration_no TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS examinations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      course_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      trainer_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      exam_type TEXT NOT NULL,
      exam_date DATE NOT NULL,
      duration TEXT NOT NULL,
      total_marks INTEGER NOT NULL,
      number_of_questions INTEGER NOT NULL,
      instructions TEXT,
      additional_notes TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      status TEXT DEFAULT 'SUBMITTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (trainer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_role TEXT,
      examination_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (examination_id) REFERENCES examinations(id)
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed Roles
  const roles = [
    'SUPER_ADMIN',
    'CENTER_MANAGER',
    'ADMIN',
    'TEAM_LEAD',
    'COUNSELLOR',
    'TRAINER'
  ];
  for (const role of roles) {
    db.run('INSERT INTO roles (role_name) VALUES (?)', [role]);
  }

  // Seed Users with distinct, secure individual passwords
  const seedUsers = [
    {
      name: 'Super Admin',
      username: 'superadmin',
      email: 'superadmin@datapro.in',
      password: 'SuperAdmin@2026',
      role_id: 1, // SUPER_ADMIN
      mobile: '+91 98480 12345',
      status: 'ACTIVE'
    },
    {
      name: 'Vara Prasad Sir',
      username: 'varaprasad.manager',
      email: 'varaprasad.manager@datapro.in',
      password: 'VaraPrasad@Mgr26',
      role_id: 2, // CENTER_MANAGER
      mobile: '+91 98480 54321',
      status: 'ACTIVE'
    },
    {
      name: 'Vinith Sir',
      username: 'vinith',
      email: 'vinith@datapro.in',
      password: 'Vinith@Adm26',
      role_id: 3, // ADMIN
      mobile: '+91 94401 23456',
      status: 'ACTIVE'
    },
    {
      name: 'Azmal Sir',
      username: 'azmal',
      email: 'azmal@datapro.in',
      password: 'Azmal@Lead26',
      role_id: 4, // TEAM_LEAD
      mobile: '+91 98850 67890',
      status: 'ACTIVE'
    },
    {
      name: 'Manasa Madam',
      username: 'manasa',
      email: 'manasa@datapro.in',
      password: 'Manasa@Couns26',
      role_id: 5, // COUNSELLOR
      mobile: '+91 91234 56789',
      status: 'ACTIVE'
    },
    {
      name: 'Srinivas Sir',
      username: 'srinivas',
      email: 'srinivas@datapro.in',
      password: 'Srinivas@Trn26',
      role_id: 6, // TRAINER
      mobile: '+91 98661 11223',
      status: 'ACTIVE'
    }
  ];

  for (const u of seedUsers) {
    const userHash = bcrypt.hashSync(u.password, 10);
    db.run(
      `INSERT INTO users (name, username, email, password_hash, role_id, mobile, status, created_at, last_login)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '-5 days'), datetime('now', '-2 hours'))`,
      [u.name, u.username, u.email, userHash, u.role_id, u.mobile, u.status]
    );
  }

  // Seed Courses
  const seedCourses = [
    {
      name: 'Python Full Stack Development',
      code: 'PFS',
      duration: '6 Months (120 Hours)',
      description: 'Comprehensive Python stack including Core Python, Advanced OOP, Django, FastAPI, React, PostgreSQL & Cloud Deployment.'
    },
    {
      name: 'Java Full Stack Development',
      code: 'JFS',
      duration: '6 Months (120 Hours)',
      description: 'Enterprise Java architecture including Core Java, Spring Boot, Microservices, Hibernate, Angular/React & Docker.'
    },
    {
      name: 'MERN Stack Web Development',
      code: 'MERN',
      duration: '4 Months (90 Hours)',
      description: 'Full JavaScript ecosystem including MongoDB, Express.js, React.js, Node.js, Next.js and RESTful API architecture.'
    },
    {
      name: 'Data Analytics & Power BI',
      code: 'DA',
      duration: '3 Months (60 Hours)',
      description: 'Business data analytics, Advanced SQL, Excel dashboarding, Power BI, DAX modeling and Tableau visualization.'
    },
    {
      name: 'Data Science & Machine Learning',
      code: 'DS',
      duration: '6 Months (120 Hours)',
      description: 'Statistical modeling, Python, NumPy, Pandas, Scikit-Learn, Deep Learning with TensorFlow and NLP basics.'
    },
    {
      name: 'C & C++ Programming Foundation',
      code: 'CPP',
      duration: '2 Months (45 Hours)',
      description: 'Core logic building, pointers, memory management, object-oriented concepts and algorithms.'
    },
    {
      name: 'SQL & Database Engineering',
      code: 'SQL',
      duration: '2 Months (40 Hours)',
      description: 'Relational database schema design, stored procedures, indexing, performance query tuning and MySQL administration.'
    },
    {
      name: 'Advanced Excel & Business Modeling',
      code: 'EXCEL',
      duration: '1.5 Months (30 Hours)',
      description: 'VLOOKUP, XLOOKUP, Pivot tables, Power Query, Macros, VBA scripting and automated financial modeling.'
    }
  ];

  for (const c of seedCourses) {
    db.run(
      `INSERT INTO courses (course_name, course_code, duration, description) VALUES (?, ?, ?, ?)`,
      [c.name, c.code, c.duration, c.description]
    );
  }

  // Seed Trainer Course Assignments
  // Srinivas Sir (ID 6): Python Full Stack (1), Java Full Stack (2), MERN (3), Data Analytics (4), Data Science (5), C/C++ (6), SQL (7), Excel (8)
  const assignments = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8]
  ];
  for (const [tId, cId] of assignments) {
    db.run(`INSERT INTO trainer_course_assignments (trainer_id, course_id) VALUES (?, ?)`, [tId, cId]);
  }

  // Batches, Students, Examinations, Notifications, and Activity Logs start 100% FRESH and clean
}
