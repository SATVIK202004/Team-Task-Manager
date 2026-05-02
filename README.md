# TaskFlow — Team Task Manager

A collaborative team task management platform where users can create projects, assign tasks to members, and track progress through an intuitive dashboard. Built with role-based access control supporting Admin and Member roles.

**Live Demo:** [Railway URL]  
**Demo Video:** [Link]

---

## Screenshots

### Login & OTP Verification
Two-step authentication with email-based OTP verification for secure access.

![Login Page](client/public/screenshots/login.png)

![OTP Verification](client/public/screenshots/otp-verification.png)

### Dashboard
Real-time overview showing task counts, status breakdown, overdue alerts, and recent activity.

![Dashboard](client/public/screenshots/dashboard.png)

### Project Management
Create projects, invite team members by email, and organize work into focused workspaces.

![Projects](client/public/screenshots/projects.png)

### Task Board
Full task lifecycle management with priority levels, due dates, assignees, and status tracking.

![Tasks](client/public/screenshots/tasks.png)

---

## Features

- **User Authentication** — Signup and login with email OTP verification
- **Password Recovery** — Forgot password flow with OTP-based reset
- **Welcome Email** — Confirmation email sent after successful registration
- **Project Management** — Create, update, and delete team projects
- **Team Collaboration** — Add or remove members from projects using their email
- **Task Tracking** — Create tasks with title, description, priority, status, due date, and assignee
- **Status Workflow** — Move tasks through To Do → In Progress → Done
- **Priority Levels** — Categorize tasks as Low, Medium, or High priority
- **Overdue Detection** — Automatic highlighting of tasks past their due date
- **Dashboard Analytics** — Visual stats for total, pending, active, completed, overdue, and high-priority tasks
- **Search & Filter** — Find tasks by keyword, project, status, or priority
- **Role-Based Access** — Admins manage projects and members; Members manage their own tasks

### Role Permissions

| Action | Admin | Member |
|--------|:-----:|:------:|
| Create / delete projects | ✔ | ✘ |
| Add / remove team members | ✔ | ✘ |
| Create tasks | ✔ | ✔ |
| Update task status | ✔ | ✔ (assigned/own) |
| Delete tasks | ✔ | ✔ (own only) |
| View dashboard | ✔ | ✔ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router v7 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Authentication | JWT, bcryptjs, email OTP |
| Email Service | Nodemailer with Gmail SMTP |
| Validation | express-validator |
| UI Icons | react-icons (Heroicons set) |
| Deployment | Railway (nixpacks) |

---

## Project Structure

```
├── client/                     # React frontend (Vite)
│   ├── public/
│   │   └── favicon.svg         # Custom app icon
│   ├── src/
│   │   ├── components/         # Navbar, ProtectedRoute
│   │   ├── context/            # Auth context with JWT handling
│   │   ├── pages/              # All page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetail.jsx
│   │   │   └── Tasks.jsx
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # Route definitions
│   │   └── index.css           # Global styles
│   └── package.json
│
├── server/                     # Express backend
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── middleware/
│   │   └── auth.js             # JWT verification & role guards
│   ├── models/
│   │   ├── User.js             # User schema (name, email, role, isVerified)
│   │   ├── Project.js          # Project schema (name, owner, members)
│   │   ├── Task.js             # Task schema (title, status, priority, etc.)
│   │   └── OTP.js              # OTP schema with TTL auto-expiry
│   ├── routes/
│   │   ├── auth.js             # Auth endpoints (register, login, OTP, reset)
│   │   ├── projects.js         # Project CRUD + member management
│   │   └── tasks.js            # Task CRUD + dashboard stats
│   ├── utils/
│   │   └── sendEmail.js        # OTP and welcome email templates
│   ├── seed.js                 # Initial admin account seeder
│   ├── index.js                # Server entry point
│   └── package.json
│
├── nixpacks.toml               # Railway build configuration
├── .gitignore
└── README.md
```

---

## API Reference

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create new account | No |
| POST | `/api/auth/verify-register` | Verify registration OTP | No |
| POST | `/api/auth/login` | Login and receive OTP | No |
| POST | `/api/auth/verify-login` | Verify login OTP and get JWT | No |
| POST | `/api/auth/forgot-password` | Request password reset OTP | No |
| POST | `/api/auth/reset-password` | Reset password with OTP | No |
| POST | `/api/auth/resend-otp` | Resend verification code | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Projects

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects` | List user's projects | Yes |
| POST | `/api/projects` | Create project | Admin |
| GET | `/api/projects/:id` | Get project details | Yes |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project and tasks | Admin |
| POST | `/api/projects/:id/members` | Add member by email | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tasks` | List tasks (with filters) | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| GET | `/api/tasks/:id` | Get task details | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |
| GET | `/api/tasks/dashboard/stats` | Get dashboard statistics | Yes |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas cluster
- Gmail account with an App Password enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/SATVIK202004/team-task-manager.git
cd team-task-manager

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
cd ..
```

### Environment Setup

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_FROM=TaskFlow <your_email@gmail.com>
```

### Running Locally

```bash
# From the root directory — starts both server and client
npm run dev
```

- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:5173`

---

## Deployment

This project is configured for **Railway** deployment using `nixpacks.toml`:

1. Push your code to GitHub
2. Create a new project on [Railway](https://railway.app)
3. Connect the GitHub repository
4. Add all environment variables from `.env` in the Railway dashboard
5. Deploy — Railway handles the build and start automatically

The build process:
- Installs both server and client dependencies
- Builds the React frontend with Vite
- Starts the Express server, which serves the built frontend in production

---

## Database Schema

```
User
├── name (String)
├── email (String, unique)
├── password (String, hashed)
├── role (admin | member)
└── isVerified (Boolean)

Project
├── name (String)
├── description (String)
├── owner → User
└── members → [User]

Task
├── title (String)
├── description (String)
├── status (todo | in-progress | done)
├── priority (low | medium | high)
├── dueDate (Date)
├── project → Project
├── assignedTo → User
└── createdBy → User

OTP
├── email (String)
├── code (String)
├── purpose (register | login | reset)
└── expiresAt (Date, TTL index)
```

---

## Author

**Satvik Peddisetty**

---

## License

MIT
