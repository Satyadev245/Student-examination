import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { queryAll, queryOne, execute } from './db.js';
import { authenticateToken, requireRole, generateToken, AuthenticatedRequest } from './auth.js';
import { examUpload } from './upload.js';

export const apiRouter = express.Router();

// Helper to log system activity (Section 14)
function logActivity(
  userId: number | null,
  userName: string,
  userRole: string,
  action: string,
  description: string,
  ip: string = '127.0.0.1'
) {
  try {
    execute(
      `INSERT INTO activity_logs (user_id, user_name, user_role, action, description, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, userName, userRole, action, description, ip]
    );
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

// -------------------------------------------------------------
// AUTHENTICATION ROUTES (Section 2 & 3)
// -------------------------------------------------------------

apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be username or email

  if (!identifier || !password) {
    res.status(400).json({ error: 'Username/Email and Password are required.' });
    return;
  }

  const rawIdent = identifier.trim().toLowerCase();
  let searchIdent = rawIdent;
  if (rawIdent === 'vinit') searchIdent = 'vinith';
  if (rawIdent === 'azmal.lead') searchIdent = 'azmal';
  if (rawIdent === 'varaprasad') searchIdent = 'varaprasad.manager';

  const user = queryOne<any>(
    `SELECT u.id, u.name, u.username, u.email, u.password_hash, u.status, u.role_id, r.role_name as role, u.mobile
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE LOWER(u.username) = LOWER(?) OR LOWER(u.email) = LOWER(?) OR LOWER(u.username) = LOWER(?)`,
    [searchIdent, rawIdent, rawIdent]
  );

  if (!user) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  if (user.status !== 'ACTIVE') {
    res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
    return;
  }

  const isMatch = bcrypt.compareSync(password, user.password_hash);
  if (!isMatch) {
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  // Update last login timestamp
  execute(`UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`, [user.id]);

  const authUser = {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role,
    role_id: user.role_id,
    mobile: user.mobile,
    status: user.status
  };

  const token = generateToken(authUser);

  // Log activity
  logActivity(
    user.id,
    user.name,
    user.role,
    'LOGIN',
    `User ${user.name} (${user.role}) logged in successfully.`,
    req.ip || '127.0.0.1'
  );

  res.json({
    message: 'Login successful.',
    user: authUser,
    token
  });
});

apiRouter.post('/auth/logout', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    logActivity(
      req.user.id,
      req.user.name,
      req.user.role,
      'LOGOUT',
      `User ${req.user.name} logged out.`,
      req.ip || '127.0.0.1'
    );
  }
  res.json({ message: 'Logged out successfully.' });
});

apiRouter.get('/auth/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = queryOne<any>(
    `SELECT u.id, u.name, u.username, u.email, u.status, u.role_id, r.role_name as role, u.mobile, u.last_login, u.created_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.id = ?`,
    [req.user!.id]
  );
  if (!user) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user });
});

apiRouter.post('/auth/change-password', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required.' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    return;
  }

  const user = queryOne<any>('SELECT password_hash FROM users WHERE id = ?', [req.user!.id]);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    res.status(400).json({ error: 'Incorrect current password.' });
    return;
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user!.id]);

  logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'PASSWORD_CHANGE',
    `User changed their password.`
  );

  res.json({ message: 'Password changed successfully.' });
});

apiRouter.put('/auth/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { name, mobile, email } = req.body;
  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required.' });
    return;
  }

  execute(
    'UPDATE users SET name = ?, mobile = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name.trim(), mobile?.trim() || null, email.trim(), req.user!.id]
  );

  res.json({ message: 'Profile updated successfully.' });
});

// -------------------------------------------------------------
// DASHBOARD STATS (Section 4)
// -------------------------------------------------------------

apiRouter.get('/stats/dashboard', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  
  if (user.role === 'TRAINER') {
    // Trainer specific statistics
    const coursesCount = queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT course_id) as count FROM batches WHERE trainer_id = ? AND status = 'ACTIVE'`,
      [user.id]
    )?.count || 0;

    const batchesCount = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM batches WHERE trainer_id = ? AND status = 'ACTIVE'`,
      [user.id]
    )?.count || 0;

    const studentsCount = queryOne<{ count: number }>(
      `SELECT COUNT(s.id) as count 
       FROM students s 
       JOIN batches b ON s.batch_id = b.id 
       WHERE b.trainer_id = ? AND s.status = 'ACTIVE'`,
      [user.id]
    )?.count || 0;

    const uploadedPapersCount = queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM examinations WHERE trainer_id = ?`,
      [user.id]
    )?.count || 0;

    const recentUploads = queryAll(
      `SELECT e.id, e.exam_id, e.title, e.subject, e.exam_type, e.exam_date, e.total_marks, e.status, e.created_at,
              c.course_name, b.batch_code
       FROM examinations e
       JOIN courses c ON e.course_id = c.id
       JOIN batches b ON e.batch_id = b.id
       WHERE e.trainer_id = ?
       ORDER BY e.created_at DESC LIMIT 5`,
      [user.id]
    );

    const assignedCourses = queryAll(
      `SELECT DISTINCT c.id, c.course_name, c.course_code, c.duration
       FROM courses c
       JOIN batches b ON b.course_id = c.id
       WHERE b.trainer_id = ? AND b.status = 'ACTIVE'`,
      [user.id]
    );

    const assignedBatches = queryAll(
      `SELECT b.id, b.batch_name, b.batch_code, b.timing, b.start_date, c.course_name,
              (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) as student_count
       FROM batches b
       JOIN courses c ON b.course_id = c.id
       WHERE b.trainer_id = ? AND b.status = 'ACTIVE'`,
      [user.id]
    );

    res.json({
      role: 'TRAINER',
      totalCourses: coursesCount,
      activeBatches: batchesCount,
      totalStudents: studentsCount,
      uploadedPapers: uploadedPapersCount,
      recentUploads,
      assignedCourses,
      assignedBatches
    });
    return;
  }

  // Admin, Super Admin, Center Manager, Team Lead, Counsellor stats
  const totalStudents = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM students WHERE status = 'ACTIVE'`)?.count || 0;
  const totalTrainers = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role_id = 6 AND status = 'ACTIVE'`)?.count || 0;
  const totalCourses = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM courses WHERE status = 'ACTIVE'`)?.count || 0;
  const totalBatches = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM batches WHERE status = 'ACTIVE'`)?.count || 0;
  const totalExaminations = queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM examinations`)?.count || 0;

  const recentUploads = queryAll(
    `SELECT e.id, e.exam_id, e.title, e.subject, e.exam_type, e.exam_date, e.total_marks, e.status, e.created_at,
            c.course_name, b.batch_code, u.name as trainer_name
     FROM examinations e
     JOIN courses c ON e.course_id = c.id
     JOIN batches b ON e.batch_id = b.id
     JOIN users u ON e.trainer_id = u.id
     ORDER BY e.created_at DESC LIMIT 6`
  );

  const recentActivities = queryAll(
    `SELECT id, user_name, user_role, action, description, created_at
     FROM activity_logs
     ORDER BY created_at DESC LIMIT 6`
  );

  const courseStats = queryAll(
    `SELECT c.id, c.course_name, c.course_code,
            COUNT(DISTINCT s.id) as student_count,
            COUNT(DISTINCT e.id) as exam_count
     FROM courses c
     LEFT JOIN students s ON s.course_id = c.id
     LEFT JOIN examinations e ON e.course_id = c.id
     WHERE c.status = 'ACTIVE'
     GROUP BY c.id
     ORDER BY student_count DESC`
  );

  res.json({
    role: user.role,
    totalStudents,
    totalTrainers,
    totalCourses,
    totalBatches,
    totalExaminations,
    recentUploads,
    recentActivities,
    courseStats
  });
});

// -------------------------------------------------------------
// COURSES MANAGEMENT (Section 5)
// -------------------------------------------------------------

apiRouter.get('/courses', authenticateToken, (req, res) => {
  const courses = queryAll(
    `SELECT c.*,
            (SELECT COUNT(*) FROM batches b WHERE b.course_id = c.id) as batch_count,
            (SELECT COUNT(*) FROM students s WHERE s.course_id = c.id) as student_count,
            (SELECT COUNT(*) FROM examinations e WHERE e.course_id = c.id) as exam_count
     FROM courses c
     ORDER BY c.course_name ASC`
  );
  res.json({ courses });
});

apiRouter.post('/courses', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { course_name, course_code, description, duration } = req.body;
  if (!course_name || !course_code || !duration) {
    res.status(400).json({ error: 'Course name, code, and duration are required.' });
    return;
  }

  const existing = queryOne('SELECT id FROM courses WHERE LOWER(course_code) = LOWER(?)', [course_code.trim()]);
  if (existing) {
    res.status(400).json({ error: 'A course with this course code already exists.' });
    return;
  }

  const result = execute(
    `INSERT INTO courses (course_name, course_code, description, duration, status)
     VALUES (?, ?, ?, ?, 'ACTIVE')`,
    [course_name.trim(), course_code.trim().toUpperCase(), description?.trim() || '', duration.trim()]
  );

  logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'COURSE_CREATE',
    `Created course ${course_name} (${course_code.toUpperCase()}).`
  );

  res.status(201).json({ message: 'Course created successfully.', id: result.lastInsertRowId });
});

apiRouter.put('/courses/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { course_name, description, duration, status } = req.body;

  execute(
    `UPDATE courses SET course_name = ?, description = ?, duration = ?, status = ? WHERE id = ?`,
    [course_name.trim(), description?.trim() || '', duration.trim(), status || 'ACTIVE', id]
  );

  logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'COURSE_UPDATE',
    `Updated course details for course ID ${id}.`
  );

  res.json({ message: 'Course updated successfully.' });
});

apiRouter.delete('/courses/:id', authenticateToken, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  execute(`UPDATE courses SET status = 'INACTIVE' WHERE id = ?`, [id]);
  logActivity(req.user!.id, req.user!.name, req.user!.role, 'COURSE_DEACTIVATE', `Deactivated course ID ${id}.`);
  res.json({ message: 'Course deactivated successfully.' });
});

// -------------------------------------------------------------
// BATCHES MANAGEMENT (Section 6)
// -------------------------------------------------------------

apiRouter.get('/batches', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let sql = `
    SELECT b.*, c.course_name, c.course_code, u.name as trainer_name, u.email as trainer_email,
           (SELECT COUNT(*) FROM students s WHERE s.batch_id = b.id) as student_count
    FROM batches b
    JOIN courses c ON b.course_id = c.id
    JOIN users u ON b.trainer_id = u.id
  `;
  const params: any[] = [];

  if (user.role === 'TRAINER') {
    sql += ` WHERE b.trainer_id = ?`;
    params.push(user.id);
  }

  sql += ` ORDER BY b.start_date DESC`;
  const batches = queryAll(sql, params);
  res.json({ batches });
});

apiRouter.post('/batches', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { batch_name, batch_code, course_id, trainer_id, start_date, end_date, timing } = req.body;
  if (!batch_name || !batch_code || !course_id || !trainer_id || !start_date || !timing) {
    res.status(400).json({ error: 'All batch fields (name, code, course, trainer, start date, timing) are required.' });
    return;
  }

  const existing = queryOne('SELECT id FROM batches WHERE LOWER(batch_code) = LOWER(?)', [batch_code.trim()]);
  if (existing) {
    res.status(400).json({ error: 'A batch with this code already exists.' });
    return;
  }

  const result = execute(
    `INSERT INTO batches (batch_name, batch_code, course_id, trainer_id, start_date, end_date, timing, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [batch_name.trim(), batch_code.trim().toUpperCase(), course_id, trainer_id, start_date, end_date || null, timing.trim()]
  );

  // Ensure trainer is also mapped to the course
  execute(
    `INSERT OR IGNORE INTO trainer_course_assignments (trainer_id, course_id) VALUES (?, ?)`,
    [trainer_id, course_id]
  );

  logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'BATCH_CREATE',
    `Created batch ${batch_name} (${batch_code.toUpperCase()}).`
  );

  res.status(201).json({ message: 'Batch created successfully.', id: result.lastInsertRowId });
});

apiRouter.put('/batches/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { batch_name, course_id, trainer_id, start_date, end_date, timing, status } = req.body;

  execute(
    `UPDATE batches 
     SET batch_name = ?, course_id = ?, trainer_id = ?, start_date = ?, end_date = ?, timing = ?, status = ?
     WHERE id = ?`,
    [batch_name.trim(), course_id, trainer_id, start_date, end_date || null, timing.trim(), status || 'ACTIVE', id]
  );

  logActivity(req.user!.id, req.user!.name, req.user!.role, 'BATCH_UPDATE', `Updated batch ID ${id}.`);
  res.json({ message: 'Batch updated successfully.' });
});

// -------------------------------------------------------------
// TRAINERS MANAGEMENT (Section 8)
// -------------------------------------------------------------

apiRouter.get('/trainers', authenticateToken, (req, res) => {
  const trainers = queryAll<any>(
    `SELECT u.id, u.name, u.username, u.email, u.mobile, u.status, u.created_at, u.last_login,
            (SELECT COUNT(*) FROM batches b WHERE b.trainer_id = u.id AND b.status = 'ACTIVE') as active_batches_count,
            (SELECT COUNT(*) FROM examinations e WHERE e.trainer_id = u.id) as exam_uploads_count
     FROM users u
     WHERE u.role_id = 6
     ORDER BY u.name ASC`
  );

  // Fetch assigned courses for each trainer
  for (const t of trainers) {
    t.assignedCourses = queryAll(
      `SELECT c.id, c.course_name, c.course_code
       FROM courses c
       JOIN trainer_course_assignments tca ON tca.course_id = c.id
       WHERE tca.trainer_id = ?`,
      [t.id]
    );
  }

  res.json({ trainers });
});

apiRouter.post('/trainers', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, username, email, mobile, password, course_ids } = req.body;
  if (!name || !username || !email || !password) {
    res.status(400).json({ error: 'Name, username, email and password are required.' });
    return;
  }

  const existing = queryOne('SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)', [username.trim(), email.trim()]);
  if (existing) {
    res.status(400).json({ error: 'User with this username or email already exists.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = execute(
    `INSERT INTO users (name, username, email, password_hash, role_id, mobile, status)
     VALUES (?, ?, ?, ?, 6, ?, 'ACTIVE')`,
    [name.trim(), username.trim(), email.trim(), hash, mobile?.trim() || null]
  );

  const trainerId = result.lastInsertRowId!;

  if (Array.isArray(course_ids)) {
    for (const cId of course_ids) {
      execute(`INSERT OR IGNORE INTO trainer_course_assignments (trainer_id, course_id) VALUES (?, ?)`, [trainerId, cId]);
    }
  }

  logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'TRAINER_CREATE',
    `Added new trainer: ${name} (${username}).`
  );

  res.status(201).json({ message: 'Trainer added successfully.', id: trainerId });
});

apiRouter.put('/trainers/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, mobile, status, course_ids } = req.body;

  execute(
    `UPDATE users SET name = ?, email = ?, mobile = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role_id = 6`,
    [name.trim(), email.trim(), mobile?.trim() || null, status || 'ACTIVE', id]
  );

  if (Array.isArray(course_ids)) {
    execute(`DELETE FROM trainer_course_assignments WHERE trainer_id = ?`, [id]);
    for (const cId of course_ids) {
      execute(`INSERT OR IGNORE INTO trainer_course_assignments (trainer_id, course_id) VALUES (?, ?)`, [id, cId]);
    }
  }

  logActivity(req.user!.id, req.user!.name, req.user!.role, 'TRAINER_UPDATE', `Updated trainer profile for ID ${id}.`);
  res.json({ message: 'Trainer details updated successfully.' });
});

apiRouter.post('/trainers/:id/reset-password', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  execute(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hash, id]);

  logActivity(req.user!.id, req.user!.name, req.user!.role, 'PASSWORD_RESET', `Reset password for user ID ${id}.`);
  res.json({ message: 'Password reset successfully.' });
});

apiRouter.post('/users/:id/reset-password', authenticateToken, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const targetUser = queryOne<any>('SELECT name, username FROM users WHERE id = ?', [id]);
  if (!targetUser) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  execute(`UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [hash, id]);

  logActivity(req.user!.id, req.user!.name, req.user!.role, 'PASSWORD_RESET', `Super Admin reset password for ${targetUser.name} (@${targetUser.username}).`);
  res.json({ message: `Password reset successfully for ${targetUser.name}.` });
});

// -------------------------------------------------------------
// STUDENTS MANAGEMENT (Section 7)
// -------------------------------------------------------------

apiRouter.get('/students', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { search, course_id, batch_id, status } = req.query;

  let sql = `
    SELECT s.*, c.course_name, c.course_code, b.batch_name, b.batch_code, b.timing
    FROM students s
    JOIN courses c ON s.course_id = c.id
    JOIN batches b ON s.batch_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // If trainer, limit to batches assigned to this trainer
  if (user.role === 'TRAINER') {
    sql += ` AND b.trainer_id = ?`;
    params.push(user.id);
  }

  if (course_id) {
    sql += ` AND s.course_id = ?`;
    params.push(course_id);
  }
  if (batch_id) {
    sql += ` AND s.batch_id = ?`;
    params.push(batch_id);
  }
  if (status) {
    sql += ` AND s.status = ?`;
    params.push(status);
  }
  if (search && typeof search === 'string') {
    sql += ` AND (LOWER(s.name) LIKE ? OR LOWER(s.student_id) LIKE ? OR LOWER(s.registration_no) LIKE ? OR LOWER(s.mobile) LIKE ? OR LOWER(s.email) LIKE ?)`;
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term, term, term);
  }

  sql += ` ORDER BY s.id DESC`;
  const students = queryAll(sql, params);
  res.json({ students });
});

apiRouter.post('/students', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'COUNSELLOR']), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, mobile, course_id, batch_id, joining_date, address, registration_no } = req.body;
  if (!name || !email || !mobile || !course_id || !batch_id || !joining_date) {
    res.status(400).json({ error: 'Name, email, mobile, course, batch, and joining date are required.' });
    return;
  }

  const countRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM students');
  const nextNum = (countRow?.count || 0) + 1;
  const student_id = `DP-STD-${nextNum.toString().padStart(4, '0')}`;
  const regNo = registration_no?.trim() || `DP-GJW-2026-${nextNum.toString().padStart(3, '0')}`;

  const result = execute(
    `INSERT INTO students (student_id, name, email, mobile, course_id, batch_id, joining_date, status, address, registration_no)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
    [student_id, name.trim(), email.trim(), mobile.trim(), course_id, batch_id, joining_date, address?.trim() || null, regNo]
  );

  logActivity(
    req.user!.id,
    req.user!.name,
    req.user!.role,
    'STUDENT_CREATE',
    `Added new student: ${name} (${student_id}).`
  );

  res.status(201).json({ message: 'Student registered successfully.', id: result.lastInsertRowId, student_id });
});

apiRouter.put('/students/:id', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'COUNSELLOR']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, mobile, course_id, batch_id, status, address, registration_no } = req.body;

  execute(
    `UPDATE students 
     SET name = ?, email = ?, mobile = ?, course_id = ?, batch_id = ?, status = ?, address = ?, registration_no = ?
     WHERE id = ?`,
    [name.trim(), email.trim(), mobile.trim(), course_id, batch_id, status || 'ACTIVE', address?.trim() || null, registration_no?.trim(), id]
  );

  logActivity(req.user!.id, req.user!.name, req.user!.role, 'STUDENT_UPDATE', `Updated student details for ID ${id}.`);
  res.json({ message: 'Student details updated successfully.' });
});

// -------------------------------------------------------------
// EXAMINATION MANAGEMENT & UPLOAD (Section 9, 10, 11, 12)
// -------------------------------------------------------------

apiRouter.get('/examinations', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { course_id, batch_id, trainer_id, status, exam_type, search } = req.query;

  let sql = `
    SELECT e.*, c.course_name, c.course_code, b.batch_name, b.batch_code, b.timing,
           u.name as trainer_name, u.email as trainer_email
    FROM examinations e
    JOIN courses c ON e.course_id = c.id
    JOIN batches b ON e.batch_id = b.id
    JOIN users u ON e.trainer_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Trainer can only see examinations for their assigned course/batches (or uploaded by them)
  if (user.role === 'TRAINER') {
    sql += ` AND e.trainer_id = ?`;
    params.push(user.id);
  }

  if (course_id) {
    sql += ` AND e.course_id = ?`;
    params.push(course_id);
  }
  if (batch_id) {
    sql += ` AND e.batch_id = ?`;
    params.push(batch_id);
  }
  if (trainer_id) {
    sql += ` AND e.trainer_id = ?`;
    params.push(trainer_id);
  }
  if (status) {
    sql += ` AND e.status = ?`;
    params.push(status);
  }
  if (exam_type) {
    sql += ` AND e.exam_type = ?`;
    params.push(exam_type);
  }
  if (search && typeof search === 'string') {
    sql += ` AND (LOWER(e.title) LIKE ? OR LOWER(e.exam_id) LIKE ? OR LOWER(e.subject) LIKE ?)`;
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY e.created_at DESC`;
  const examinations = queryAll(sql, params);
  res.json({ examinations });
});

apiRouter.get('/examinations/:id', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const exam = queryOne<any>(
    `SELECT e.*, c.course_name, c.course_code, b.batch_name, b.batch_code, b.timing,
            u.name as trainer_name, u.email as trainer_email, u.mobile as trainer_mobile
     FROM examinations e
     JOIN courses c ON e.course_id = c.id
     JOIN batches b ON e.batch_id = b.id
     JOIN users u ON e.trainer_id = u.id
     WHERE e.id = ? OR e.exam_id = ?`,
    [id, id]
  );

  if (!exam) {
    res.status(404).json({ error: 'Examination record not found.' });
    return;
  }

  if (user.role === 'TRAINER' && exam.trainer_id !== user.id) {
    res.status(403).json({ error: 'Unauthorized to view this examination record.' });
    return;
  }

  res.json({ examination: exam });
});

// UPLOAD EXAMINATION PAPER (Section 9, 10, 11)
apiRouter.post(
  '/examinations',
  authenticateToken,
  examUpload.single('exam_file'),
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    if (!req.file) {
      res.status(400).json({ error: 'Please upload an examination paper file (PDF, DOC, DOCX, JPG, PNG).' });
      return;
    }

    const {
      title,
      course_id,
      batch_id,
      subject,
      exam_type,
      exam_date,
      duration,
      total_marks,
      number_of_questions,
      instructions,
      additional_notes
    } = req.body;

    if (!title || !course_id || !batch_id || !subject || !exam_type || !exam_date || !duration || !total_marks) {
      // Cleanup uploaded file on error
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(400).json({ error: 'Missing required examination fields.' });
      return;
    }

    const parsedCourseId = parseInt(course_id, 10);
    const parsedBatchId = parseInt(batch_id, 10);

    // Business Rule 4: System validates trainer permissions & assignment
    if (user.role === 'TRAINER') {
      const batchCheck = queryOne(
        `SELECT id FROM batches WHERE id = ? AND course_id = ? AND trainer_id = ?`,
        [parsedBatchId, parsedCourseId, user.id]
      );
      if (!batchCheck) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        res.status(403).json({
          error: 'Permission denied: You can only upload examination papers for courses and batches assigned to you.'
        });
        return;
      }
    }

    // Generate unique Examination ID: EXAM-2026-000XXX
    const countRow = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM examinations');
    const nextExamNum = (countRow?.count || 0) + 105;
    const exam_id = `EXAM-2026-${nextExamNum.toString().padStart(6, '0')}`;

    // Relative path for database reference
    const relativeFilePath = path.relative(process.cwd(), req.file.path);

    const trainerIdToRecord = user.role === 'TRAINER' ? user.id : (req.body.trainer_id ? parseInt(req.body.trainer_id, 10) : user.id);

    const result = execute(
      `INSERT INTO examinations (
        exam_id, title, course_id, batch_id, trainer_id, subject, exam_type, exam_date,
        duration, total_marks, number_of_questions, instructions, additional_notes,
        file_name, file_path, file_type, file_size, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')`,
      [
        exam_id,
        title.trim(),
        parsedCourseId,
        parsedBatchId,
        trainerIdToRecord,
        subject.trim(),
        exam_type.trim(),
        exam_date,
        duration.trim(),
        parseInt(total_marks, 10) || 100,
        parseInt(number_of_questions, 10) || 10,
        instructions?.trim() || '',
        additional_notes?.trim() || '',
        req.file.originalname,
        relativeFilePath,
        req.file.mimetype,
        req.file.size
      ]
    );

    const newExamDbId = result.lastInsertRowId!;

    // Fetch batch and course metadata for rich notification
    const meta = queryOne<any>(
      `SELECT c.course_name, b.batch_code, b.batch_name FROM batches b JOIN courses c ON b.course_id = c.id WHERE b.id = ?`,
      [parsedBatchId]
    );

    const notifMessage = `New examination paper uploaded by ${user.name} for ${meta?.course_name || 'Course'} – Batch ${meta?.batch_code || ''}.`;

    // Business Rule: Create notifications for administrative users (Center Manager, Admin, Team Lead, Counsellor)
    const adminRoles = ['CENTER_MANAGER', 'ADMIN', 'TEAM_LEAD', 'COUNSELLOR'];
    for (const role of adminRoles) {
      execute(
        `INSERT INTO notifications (target_role, examination_id, title, message, is_read)
         VALUES (?, ?, 'New Examination Paper Uploaded', ?, 0)`,
        [role, newExamDbId, notifMessage]
      );
    }

    // Business Rule 12: Record in activity log
    logActivity(
      user.id,
      user.name,
      user.role,
      'EXAMINATION_UPLOAD',
      `Uploaded examination paper ${exam_id} (${title}) for Batch ${meta?.batch_code || ''}.`
    );

    res.status(201).json({
      message: 'Examination paper uploaded successfully.',
      exam_id,
      id: newExamDbId
    });
  }
);

// SECURE EXAMINATION DOWNLOAD (Section 12 & 24 Business Rule 14)
apiRouter.get('/examinations/:id/download', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const exam = queryOne<any>('SELECT * FROM examinations WHERE id = ? OR exam_id = ?', [id, id]);
  if (!exam) {
    res.status(404).json({ error: 'Examination record not found.' });
    return;
  }

  // Trainer can only download their own exam papers
  if (user.role === 'TRAINER' && exam.trainer_id !== user.id) {
    res.status(403).json({ error: 'Unauthorized to download this examination paper.' });
    return;
  }

  const fullPath = path.resolve(process.cwd(), exam.file_path);
  if (!fs.existsSync(fullPath)) {
    res.status(404).json({ error: 'The physical exam paper file was not found on the server.' });
    return;
  }

  // Record download activity log
  logActivity(
    user.id,
    user.name,
    user.role,
    'EXAMINATION_DOWNLOAD',
    `Downloaded exam paper for ${exam.exam_id} (${exam.title}).`
  );

  res.download(fullPath, exam.file_name);
});

// PREVIEW EXAMINATION PAPER
apiRouter.get('/examinations/:id/preview', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  const exam = queryOne<any>(
    `SELECT e.*, c.course_name, b.batch_code, b.batch_name, u.name as trainer_name
     FROM examinations e
     JOIN courses c ON e.course_id = c.id
     JOIN batches b ON e.batch_id = b.id
     JOIN users u ON e.trainer_id = u.id
     WHERE e.id = ? OR e.exam_id = ?`,
    [id, id]
  );
  if (!exam) {
    res.status(404).json({ error: 'Examination record not found.' });
    return;
  }

  if (user.role === 'TRAINER' && exam.trainer_id !== user.id) {
    res.status(403).json({ error: 'Unauthorized to preview this examination paper.' });
    return;
  }

  const fullPath = path.resolve(process.cwd(), exam.file_path);
  let fileContentText = '';
  if (fs.existsSync(fullPath)) {
    try {
      fileContentText = fs.readFileSync(fullPath, 'utf-8');
    } catch {
      fileContentText = 'Binary file (PDF/DOCX) previewed via metadata.';
    }
  }

  res.json({
    examination: exam,
    previewContent: fileContentText
  });
});

// UPDATE EXAM STATUS (Admin / Center Manager review)
apiRouter.put('/examinations/:id/status', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'TEAM_LEAD']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    res.status(400).json({ error: 'Status is required.' });
    return;
  }

  execute(`UPDATE examinations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
  logActivity(req.user!.id, req.user!.name, req.user!.role, 'EXAMINATION_STATUS_UPDATE', `Updated examination ${id} status to ${status}.`);
  res.json({ message: 'Examination status updated.' });
});

// -------------------------------------------------------------
// NOTIFICATIONS SYSTEM (Section 13)
// -------------------------------------------------------------

apiRouter.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;

  // Fetch notifications targeted for this user or their role
  const notifications = queryAll(
    `SELECT n.*, e.exam_id, e.title as exam_title
     FROM notifications n
     LEFT JOIN examinations e ON n.examination_id = e.id
     WHERE n.user_id = ? OR n.target_role = ? OR n.target_role = 'ALL'
     ORDER BY n.created_at DESC LIMIT 30`,
    [user.id, user.role]
  );

  const unreadCount = queryOne<{ count: number }>(
    `SELECT COUNT(*) as count 
     FROM notifications 
     WHERE (user_id = ? OR target_role = ? OR target_role = 'ALL') AND is_read = 0`,
    [user.id, user.role]
  )?.count || 0;

  res.json({ notifications, unreadCount });
});

apiRouter.put('/notifications/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
  res.json({ message: 'Notification marked as read.' });
});

apiRouter.put('/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  execute(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ? OR target_role = ? OR target_role = 'ALL'`,
    [user.id, user.role]
  );
  res.json({ message: 'All notifications marked as read.' });
});

// -------------------------------------------------------------
// ACTIVITY LOGS (Section 14)
// -------------------------------------------------------------

apiRouter.get('/activity-logs', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER']), (req: AuthenticatedRequest, res: Response) => {
  const { search, action, user_role, limit = 50 } = req.query;

  let sql = `SELECT * FROM activity_logs WHERE 1=1`;
  const params: any[] = [];

  if (action) {
    sql += ` AND action = ?`;
    params.push(action);
  }
  if (user_role) {
    sql += ` AND user_role = ?`;
    params.push(user_role);
  }
  if (search && typeof search === 'string') {
    sql += ` AND (LOWER(user_name) LIKE ? OR LOWER(description) LIKE ? OR LOWER(action) LIKE ?)`;
    const term = `%${search.trim().toLowerCase()}%`;
    params.push(term, term, term);
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(Number(limit) || 50);

  const logs = queryAll(sql, params);
  res.json({ logs });
});

// -------------------------------------------------------------
// USER MANAGEMENT & ROLES (Section 1, 15)
// -------------------------------------------------------------

apiRouter.get('/users', authenticateToken, requireRole(['SUPER_ADMIN']), (req, res) => {
  const users = queryAll(
    `SELECT u.id, u.name, u.username, u.email, u.mobile, u.status, u.role_id, r.role_name as role,
            u.created_at, u.last_login
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.id ASC`
  );
  res.json({ users });
});

apiRouter.get('/roles', authenticateToken, (_req, res) => {
  const roles = queryAll('SELECT * FROM roles ORDER BY id ASC');
  res.json({ roles });
});

apiRouter.post('/users', authenticateToken, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, username, email, password, role_id, mobile } = req.body;
  if (!name || !username || !email || !password || !role_id) {
    res.status(400).json({ error: 'Name, username, email, password, and role are required.' });
    return;
  }

  const existing = queryOne('SELECT id FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)', [username.trim(), email.trim()]);
  if (existing) {
    res.status(400).json({ error: 'A user with this username or email already exists.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = execute(
    `INSERT INTO users (name, username, email, password_hash, role_id, mobile, status)
     VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [name.trim(), username.trim(), email.trim(), hash, role_id, mobile?.trim() || null]
  );

  logActivity(req.user!.id, req.user!.name, req.user!.role, 'USER_CREATE', `Created user account for ${name} (${username}).`);
  res.status(201).json({ message: 'User created successfully.', id: result.lastInsertRowId });
});

apiRouter.put('/users/:id/status', authenticateToken, requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (Number(id) === req.user!.id) {
    res.status(400).json({ error: 'You cannot deactivate your own Super Admin account.' });
    return;
  }

  execute(`UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
  logActivity(req.user!.id, req.user!.name, req.user!.role, 'USER_STATUS_CHANGE', `Set user ID ${id} status to ${status}.`);
  res.json({ message: `User status updated to ${status}.` });
});

// -------------------------------------------------------------
// REPORTS (Section 21)
// -------------------------------------------------------------

apiRouter.get('/reports', authenticateToken, requireRole(['SUPER_ADMIN', 'ADMIN', 'CENTER_MANAGER', 'TEAM_LEAD']), (_req, res) => {
  // Course-wise students & examinations
  const courseReports = queryAll(
    `SELECT c.id, c.course_name, c.course_code, c.duration,
            COUNT(DISTINCT s.id) as total_students,
            COUNT(DISTINCT b.id) as total_batches,
            COUNT(DISTINCT e.id) as total_examinations
     FROM courses c
     LEFT JOIN students s ON s.course_id = c.id
     LEFT JOIN batches b ON b.course_id = c.id
     LEFT JOIN examinations e ON e.course_id = c.id
     GROUP BY c.id
     ORDER BY total_students DESC`
  );

  // Batch-wise student distribution
  const batchReports = queryAll(
    `SELECT b.id, b.batch_name, b.batch_code, b.timing, b.start_date, b.status,
            c.course_name, u.name as trainer_name,
            COUNT(s.id) as student_count,
            (SELECT COUNT(*) FROM examinations e WHERE e.batch_id = b.id) as exam_count
     FROM batches b
     JOIN courses c ON b.course_id = c.id
     JOIN users u ON b.trainer_id = u.id
     LEFT JOIN students s ON s.batch_id = b.id
     GROUP BY b.id
     ORDER BY b.start_date DESC`
  );

  // Trainer-wise examination uploads
  const trainerReports = queryAll(
    `SELECT u.id, u.name as trainer_name, u.email, u.mobile, u.status,
            COUNT(DISTINCT b.id) as assigned_batches,
            COUNT(DISTINCT e.id) as total_uploaded_exams,
            MAX(e.created_at) as last_exam_upload
     FROM users u
     LEFT JOIN batches b ON b.trainer_id = u.id
     LEFT JOIN examinations e ON e.trainer_id = u.id
     WHERE u.role_id = 6
     GROUP BY u.id
     ORDER BY total_uploaded_exams DESC`
  );

  // Monthly examination uploads
  const monthlyUploads = queryAll(
    `SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
     FROM examinations
     GROUP BY month
     ORDER BY month DESC LIMIT 12`
  );

  res.json({
    courseReports,
    batchReports,
    trainerReports,
    monthlyUploads
  });
});
