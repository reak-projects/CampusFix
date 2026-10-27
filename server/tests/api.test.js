const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const request = require('supertest');
const { app } = require('../src/index');
const { connectDB } = require('../src/config/db');
const mongoose = require('mongoose');

jest.setTimeout(30000);

let adminCookie = '';
let staffCookie = '';
let studentCookie = '';
let testIssueId = '';

beforeAll(async () => {
  await connectDB();

  // Login admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@campusfix.dev', password: 'Admin@123' });
  expect(adminRes.status).toBe(200);
  adminCookie = adminRes.headers['set-cookie'];

  // Login staff
  const staffRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'staff@campusfix.dev', password: 'Staff@123' });
  expect(staffRes.status).toBe(200);
  staffCookie = staffRes.headers['set-cookie'];

  // Login student
  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student@campusfix.dev', password: 'Student@123' });
  expect(studentRes.status).toBe(200);
  studentCookie = studentRes.headers['set-cookie'];
}, 60000);

afterAll(async () => {
  await mongoose.connection.close();
}, 60000);

describe('CampusFix Backend API Tests', () => {
  describe('1. Health Check & Public Routes', () => {
    it('GET /api/health should return ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('POST /api/auth/register prevents self-assigning admin role', async () => {
      const uniqueEmail = `test_hacker_${Date.now()}@campusfix.dev`;
      const res = await request(app).post('/api/auth/register').send({
        name: 'Hacker User',
        email: uniqueEmail,
        password: 'Password@123',
        role: 'admin',
      });
      expect(res.status).toBe(201);
      // Ensure the role was downgraded to student
      expect(res.body.user.role).toBe('student');
    });

    it('POST /api/auth/login rejects invalid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'student@campusfix.dev',
        password: 'WrongPassword999',
      });
      expect(res.status).toBe(401);
    });

    it('GET /api/auth/me returns authenticated student profile', async () => {
      const res = await request(app).get('/api/auth/me').set('Cookie', studentCookie);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('student');
      expect(res.body.user.email).toBe('student@campusfix.dev');
    });

    it('GET /api/auth/me rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('3. Issue Management, Duplicates, and Voting', () => {
    it('GET /api/issues/check-duplicates finds potential duplicates', async () => {
      const res = await request(app)
        .get('/api/issues/check-duplicates?category=Wi-Fi&building=Library')
        .set('Cookie', studentCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.duplicates)).toBe(true);
      expect(res.body.duplicates.length).toBeGreaterThan(0);
    });

    it('POST /api/issues creates a new issue with valid payload', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Cookie', studentCookie)
        .send({
          title: 'Flickering lights in Room 302',
          description: 'The ceiling tube lights are vibrating and flickering constantly.',
          category: 'Electricity',
          building: 'Science Complex',
          floor: '3rd Floor',
          room: 'Room 302',
          priority: 'Medium',
        });
      expect(res.status).toBe(201);
      expect(res.body.issue).toBeDefined();
      expect(res.body.issue.ticketNumber).toMatch(/^CF-/);
      expect(res.body.issue.status).toBe('Reported');
      testIssueId = res.body.issue._id;
    });

    it('POST /api/issues rejects invalid payload with Zod validation', async () => {
      const res = await request(app)
        .post('/api/issues')
        .set('Cookie', studentCookie)
        .send({
          title: 'Hi', // too short
          description: 'Short', // too short
        });
      expect(res.status).toBe(400);
    });

    it('POST /api/issues/:id/vote toggles vote count', async () => {
      // First vote: records vote
      const res1 = await request(app)
        .post(`/api/issues/${testIssueId}/vote`)
        .set('Cookie', studentCookie);
      expect(res1.status).toBe(200);
      expect(res1.body.hasVoted).toBe(true);
      expect(res1.body.votesCount).toBe(1);

      // Second vote from same student: toggles off (unvote)
      const res2 = await request(app)
        .post(`/api/issues/${testIssueId}/vote`)
        .set('Cookie', studentCookie);
      expect(res2.status).toBe(200);
      expect(res2.body.hasVoted).toBe(false);
      expect(res2.body.votesCount).toBe(0);
    });

    it('POST /api/issues/:id/comments adds a comment to the issue', async () => {
      const res = await request(app)
        .post(`/api/issues/${testIssueId}/comments`)
        .set('Cookie', studentCookie)
        .send({ message: 'The flickering is causing severe headaches during lectures.' });
      expect(res.status).toBe(201);
      expect(res.body.comment.message).toBe('The flickering is causing severe headaches during lectures.');
    });

    it('GET /api/issues/:id returns issue details with status history and comments', async () => {
      const res = await request(app)
        .get(`/api/issues/${testIssueId}`)
        .set('Cookie', studentCookie);
      expect(res.status).toBe(200);
      expect(res.body.issue.ticketNumber).toBeDefined();
      expect(res.body.comments.length).toBeGreaterThanOrEqual(1);
      expect(res.body.issue.statusHistory.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Status Transitions and Role Permissions', () => {
    it('Student cannot directly advance issue from Reported to In Progress', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Cookie', studentCookie)
        .send({ status: 'In Progress' });
      expect(res.status).toBe(400); // Invalid transition sequence
    });

    it('Staff can acknowledge a Reported issue', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'Acknowledged', note: 'Staff acknowledged problem.' });
      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('Acknowledged');
    });

    it('Staff can advance Acknowledged issue to In Progress', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'In Progress', note: 'Technician dispatched.' });
      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('In Progress');
    });

    it('Staff can mark In Progress issue as Resolved', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Cookie', staffCookie)
        .send({ status: 'Resolved', note: 'Replaced ballast and tubes.' });
      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('Resolved');
    });

    it('Student reporter can reopen a Resolved issue if problem persists', async () => {
      const res = await request(app)
        .patch(`/api/issues/${testIssueId}/status`)
        .set('Cookie', studentCookie)
        .send({ status: 'Reported', note: 'Issue still happening after 2 hours.' });
      expect(res.status).toBe(200);
      expect(res.body.issue.status).toBe('Reported');
    });
  });

  describe('5. Notifications System', () => {
    it('GET /api/notifications returns user notifications with unread count', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', studentCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
      expect(typeof res.body.unreadCount).toBe('number');
    });

    it('PATCH /api/notifications/read-all marks all notifications as read', async () => {
      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Cookie', studentCookie);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('All notifications marked as read.');
    });
  });

  describe('6. Admin Analytics and Operations', () => {
    it('Admin can view MongoDB analytics aggregation', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(res.body.summary).toBeDefined();
      expect(res.body.summary.totalIssues).toBeGreaterThan(0);
      expect(Array.isArray(res.body.categoryBreakdown)).toBe(true);
      expect(Array.isArray(res.body.statusBreakdown)).toBe(true);
      expect(Array.isArray(res.body.monthlyVolume)).toBe(true);
      expect(Array.isArray(res.body.locationBreakdown)).toBe(true);
      expect(Array.isArray(res.body.staffWorkload)).toBe(true);
    });

    it('Student cannot access admin analytics (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', studentCookie);
      expect(res.status).toBe(403);
    });

    it('Admin can list all registered users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', adminCookie);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it('Admin can create a new department', async () => {
      const deptName = `Green Campus Committee ${Date.now()}`;
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Cookie', adminCookie)
        .send({
          name: deptName,
          description: 'Handles recycling and energy efficiency across campus.',
        });
      expect(res.status).toBe(201);
      expect(res.body.department.name).toBe(deptName);
    });
  });
});
