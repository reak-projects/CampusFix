# CampusFix — Campus Issue Reporting & Resolution Platform

CampusFix is an enterprise-grade full-stack MERN application for managing campus infrastructure issues, facilities repair workflows, and operational analytics. Students report campus problems, facilities and IT staff resolve them through validated status transitions, and campus administrators monitor organizational health and workload through real-time MongoDB analytics.

---

## 1. System Architecture & Features

### Role-Based Portals & Workflows
- **Student**:
  - Register with automatic role protection (prevents self-assigning admin privileges).
  - Submit issues with title, category, building, floor, room, priority, description, and multi-photo uploads.
  - **Duplicate Issue Prevention**: Real-time debounce query against MongoDB for open similar issues by category, building, and keywords. Provides interactive matching tickets with 1-click upvoting.
  - Upvote community issues to signal demand without duplicate reports.
  - Interactive status timeline (Reported → Acknowledged → In Progress → Resolved → Closed).
  - Reopen resolved tickets if the problem persists.
  - Multi-user threaded discussion and progress updates.
  - Persistent in-app notifications with unread counts and direct ticket deep links.
- **Staff**:
  - Workload triage dashboard showing personal assignments and department queues.
  - Advance status according to permitted state machine rules (Reported → Acknowledged → In Progress → Resolved).
  - Post progress updates and technician notes.
- **Administrator**:
  - Live operational analytics backed by native MongoDB aggregation pipelines:
    - Total tickets, open tickets, resolved count, overdue issues (>7 days).
    - Resolution rate (%) and average resolution time in hours computed directly from timestamps.
    - Category distribution (Recharts Donut/Pie chart).
    - Status distribution (Recharts Bar chart).
    - Top complaint campus buildings (Horizontal Bar chart).
    - Monthly ticket volume trend (Area chart).
    - Staff workload and resolution metrics diagnostic table.
  - User Directory: Role reassignment (student, staff, admin) and account activation/deactivation.
  - Department Administration: Create departments and associate maintenance personnel.
  - Reassign any campus ticket to staff or departments.

---

## 2. Technology Stack

- **Frontend**:
  - React 19 + Vite 8
  - Tailwind CSS v3 (Custom SaaS theme, slate background, navy text, indigo accent)
  - React Router DOM v7 (Role-based protected route wrappers)
  - Recharts v3 (Responsive SVG charts with tooltips and empty states)
  - Axios (Configured with credentials, token interceptors, and error handling)
  - Lucide React (Clean, accessible iconography)
- **Backend**:
  - Node.js + Express.js 5
  - MongoDB + Mongoose 9
  - JWT in HttpOnly cookies + Bearer token support
  - bcryptjs for password hashing (10 salt rounds)
  - Zod for strict payload validation
  - Multer for secure multipart image uploads (type & 5MB size limits)
  - express-rate-limit for login brute-force throttling
  - Jest & Supertest for end-to-end API integration tests

---

## 3. Project Directory Structure

```
CampusFix/
├── IMPLEMENTATION_PLAN.md      # Full architecture specification & milestones
├── README.md                   # Project documentation & run commands
├── client/                     # Vite + React Frontend
│   ├── .env.example
│   ├── tailwind.config.js      # Custom brand palette & typography
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── components/
│       │   ├── common/         # Navbar, Sidebar, Badges, Modals, StatCards, Toasts
│       │   └── layout/         # DashboardLayout
│       ├── context/            # AuthContext, NotificationContext
│       ├── pages/
│       │   ├── auth/           # LoginPage (with 1-click demo buttons), RegisterPage
│       │   ├── student/        # StudentDashboard, ReportIssuePage (with live duplicate check)
│       │   ├── staff/          # StaffDashboard
│       │   ├── admin/          # AdminDashboard (Recharts), UserManagement, DepartmentManagement
│       │   ├── issues/         # IssuesListPage, IssueDetailPage
│       │   └── notifications/  # NotificationsPage
│       ├── services/           # Axios API client
│       └── App.jsx             # Role-based route definitions
└── server/                     # Express + MongoDB Backend
    ├── .env.example
    ├── src/
    │   ├── config/             # MongoDB connection with directConnection support
    │   ├── controllers/        # authController, issueController, adminController, notificationController
    │   ├── middleware/         # requireAuth, requireRole, upload, errorHandler
    │   ├── models/             # User, Issue, Department, Comment, Notification
    │   ├── routes/             # authRoutes, issueRoutes, adminRoutes, notificationRoutes
    │   ├── seed.js             # Repeatable seed script with rich test data
    │   └── index.js            # Express app entry & server starter
    └── tests/
        └── api.test.js         # 22 comprehensive integration tests
```

---

## 4. Environment Variables

### Server (`server/.env`)
```bash
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/campusfix?directConnection=true
JWT_SECRET=campusfix_secret_jwt_key_2026_dev
FRONTEND_ORIGIN=http://localhost:5173
UPLOAD_LIMIT=5242880
```

### Client (`client/.env`)
```bash
VITE_API_URL=http://localhost:5001/api
VITE_SERVER_URL=http://localhost:5001
```

---

## 5. Quick Start Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port 27017 (or MongoDB Atlas URI)

### Step 1: Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### Step 2: Seed the Database
Populates demo accounts, campus departments, and tickets across various statuses and categories:
```bash
cd server && npm run seed
```

### Step 3: Run Backend Integration Tests
Executes 22 automated test suites:
```bash
cd server && npm test
```

### Step 4: Start the Servers
In terminal 1 (Backend API on port 5001):
```bash
cd server && npm start
```

In terminal 2 (Frontend Client on port 5173):
```bash
cd client && npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 6. Demo Accounts & Credentials

The login screen includes **1-Click Quick Demo Evaluation Buttons** to instantly sign in without typing:

| Role | Name | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | Ava Admin | `admin@campusfix.dev` | `Admin@123` | View Recharts analytics, manage users, configure departments |
| **Staff (IT)** | Elena Vance | `it@campusfix.dev` | `Staff@123` | Triage IT issues, update progress, resolve Wi-Fi tickets |
| **Staff (Facilities)**| Noah Staff | `staff@campusfix.dev` | `Staff@123` | Manage assigned physical repair workload |
| **Staff (Electrical)**| Marcus Sparks | `electrical@campusfix.dev` | `Staff@123` | Electrical and laboratory power repairs |
| **Student** | Sara Student | `student@campusfix.dev` | `Student@123` | Report problems, test duplicate detector, vote, reopen issues |
| **Student** | Alex Rivera | `alex@campusfix.dev` | `Student@123` | Report hostel problems, comment, vote |

---

## 7. REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student or staff account | Public |
| `POST` | `/api/auth/login` | Login with rate-limiting; sets HttpOnly cookie | Public |
| `POST` | `/api/auth/logout` | Clears authentication cookie | Authenticated |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Authenticated |

### Issues (`/api/issues`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/issues` | Filter, search, sort, and paginate issues | Authenticated |
| `GET` | `/api/issues/check-duplicates`| Live query for matching open tickets | Authenticated |
| `POST` | `/api/issues` | Create ticket with optional image attachments | Authenticated |
| `GET` | `/api/issues/:id` | Fetch ticket details, comments, and timeline | Authenticated |
| `PATCH`| `/api/issues/:id` | Update issue attributes | Reporter / Staff / Admin |
| `DELETE`| `/api/issues/:id` | Delete ticket (before acknowledgment or admin) | Reporter / Admin |
| `POST` | `/api/issues/:id/vote` | Toggle user upvote (prevents duplicates) | Authenticated |
| `POST` | `/api/issues/:id/comments` | Add threaded progress comment | Authenticated |
| `PATCH`| `/api/issues/:id/status` | Advance lifecycle status or reopen | Permitted roles |
| `POST` | `/api/issues/:id/assign` | Assign ticket to staff or department | Staff / Admin |

### Notifications (`/api/notifications`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get user notifications with unread counter | Authenticated |
| `PATCH`| `/api/notifications/:id/read` | Mark single notification as read | Authenticated |
| `PATCH`| `/api/notifications/read-all` | Mark all notifications as read | Authenticated |

### Admin Operations (`/api/admin`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/analytics` | Real-time MongoDB aggregation analytics | Admin only |
| `GET` | `/api/admin/users` | List all campus users with roles & status | Admin only |
| `GET` | `/api/admin/staff` | List active staff members | Admin / Staff |
| `PATCH`| `/api/admin/users/:id/role` | Change user role (student, staff, admin) | Admin only |
| `PATCH`| `/api/admin/users/:id/status` | Activate or deactivate account | Admin only |
| `GET` | `/api/admin/departments` | List campus departments and assigned staff | Admin only |
| `POST` | `/api/admin/departments` | Create new operational department | Admin only |
| `DELETE`| `/api/admin/departments/:id`| Remove department and unlink records | Admin only |

---

## 8. Test Execution Results

All 22 integration tests execute cleanly in Jest with 100% pass rate:

```
PASS tests/api.test.js
  CampusFix Backend API Tests
    1. Health Check & Public Routes
      ✓ GET /api/health should return ok
    2. Authentication & Authorization
      ✓ POST /api/auth/register prevents self-assigning admin role
      ✓ POST /api/auth/login rejects invalid credentials
      ✓ GET /api/auth/me returns authenticated student profile
      ✓ GET /api/auth/me rejects unauthenticated request
    3. Issue Management, Duplicates, and Voting
      ✓ GET /api/issues/check-duplicates finds potential duplicates
      ✓ POST /api/issues creates a new issue with valid payload
      ✓ POST /api/issues rejects invalid payload with Zod validation
      ✓ POST /api/issues/:id/vote toggles vote count
      ✓ POST /api/issues/:id/comments adds a comment to the issue
      ✓ GET /api/issues/:id returns issue details with status history and comments
    4. Status Transitions and Role Permissions
      ✓ Student cannot directly advance issue from Reported to In Progress
      ✓ Staff can acknowledge a Reported issue
      ✓ Staff can advance Acknowledged issue to In Progress
      ✓ Staff can mark In Progress issue as Resolved
      ✓ Student reporter can reopen a Resolved issue if problem persists
    5. Notifications System
      ✓ GET /api/notifications returns user notifications with unread count
      ✓ PATCH /api/notifications/read-all marks all notifications as read
    6. Admin Analytics and Operations
      ✓ Admin can view MongoDB analytics aggregation
      ✓ Student cannot access admin analytics (403 Forbidden)
      ✓ Admin can list all registered users
      ✓ Admin can create a new department

Test Suites: 1 passed, 1 total
Tests:       22 passed, 22 total
```

---

## 9. Troubleshooting Tips

1. **MongoDB Connection**: If the server fails to connect, verify that MongoDB is running (`brew services list` or `pgrep mongod`) and that `MONGO_URI` includes `?directConnection=true` to prevent replica set discovery delays on standalone local instances.
2. **CORS / Cookies**: The backend server is configured with credentials enabled for `http://localhost:5173`. If testing across different ports, ensure `FRONTEND_ORIGIN` in `server/.env` matches.
3. **Image Uploads**: Uploaded attachments are saved to `server/uploads/` and served statically via `http://localhost:5001/uploads/`.
# CampusFix
