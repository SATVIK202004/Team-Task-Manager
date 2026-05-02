# TaskFlow — Team Task Manager

A collaborative team task management platform where users can create projects, assign tasks to members, and track progress through an intuitive dashboard. Built with role-based access control supporting Admin and Member roles.

**Live Demo:** [https://team-task-manager-production-9c87.up.railway.app](https://team-task-manager-production-9c87.up.railway.app)

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
- **Keep-Alive** — Self-ping mechanism prevents the server from sleeping during inactivity

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

## Tech Stack & Why We Chose It

### Frontend — React 19 + Vite

| Technology | Purpose |
|-----------|---------|
| **React 19** | Component-based UI library for building interactive dashboards |
| **Vite** | Ultra-fast dev server and build tool |
| **React Router v7** | Client-side routing with protected routes |
| **react-icons** | Lightweight icon set (Heroicons) |

**Why React over Angular or Vue?**
- React's component model is ideal for a dashboard-heavy app with reusable cards, modals, and task lists
- Vite provides instant hot module replacement (HMR) during development — much faster than Create React App's webpack-based setup
- React 19's improved rendering performance ensures smooth UI updates when managing large task boards
- The largest ecosystem of libraries and community support for rapid development

**Why Vite over Create React App (CRA)?**
- CRA is officially deprecated and no longer maintained
- Vite starts the dev server in under 1 second vs CRA's 10-30 seconds
- Vite produces smaller, optimized production bundles with automatic code splitting
- Native ES module support means faster builds and better tree-shaking

---

### Backend — Node.js + Express.js

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime for the server |
| **Express.js** | Minimal, flexible web framework for REST APIs |
| **express-validator** | Request validation middleware |

**Why Node.js + Express over Django, Flask, or Spring Boot?**
- Full-stack JavaScript — same language on both frontend and backend reduces context switching and simplifies development
- Express.js is lightweight and unopinionated, giving full control over the architecture without unnecessary boilerplate
- Node.js excels at handling concurrent I/O operations (database queries, email sending, API calls) with its non-blocking event loop
- Massive npm ecosystem for rapid integration of packages like JWT, bcrypt, and SendGrid
- Perfect match for a real-time collaborative tool where multiple users interact with the same projects

---

### Database — MongoDB Atlas (Mongoose ODM)

| Technology | Purpose |
|-----------|---------|
| **MongoDB Atlas** | Cloud-hosted NoSQL database |
| **Mongoose** | Object Data Modeling (ODM) with schema validation |

**Why MongoDB over PostgreSQL or MySQL?**
- Flexible schema design — tasks, projects, and users have varying fields that evolve over time; MongoDB handles schema changes without migrations
- Document-based storage naturally maps to JSON objects used throughout the JavaScript stack
- MongoDB Atlas provides a free tier (512 MB) with automatic backups, monitoring, and global clusters — zero database administration
- Mongoose adds schema validation, middleware hooks (e.g., password hashing on save), and TTL indexes (auto-deleting expired OTPs)
- Embedded documents and references make it easy to model relationships like project → members and task → assignee
- Superior performance for read-heavy dashboard queries with built-in aggregation pipeline

---

### Authentication — JWT + OTP Email Verification

| Technology | Purpose |
|-----------|---------|
| **JWT (jsonwebtoken)** | Stateless session tokens with 7-day expiry |
| **bcryptjs** | Password hashing with salt rounds |
| **OTP (One-Time Password)** | 6-digit email verification codes |

**Why JWT over session-based authentication?**
- Stateless — no server-side session storage needed, making the app horizontally scalable
- The token contains the user ID, so the server can verify identity without a database lookup on every request
- Works seamlessly with single-page applications (SPAs) where the frontend stores the token in memory/localStorage
- 7-day expiry provides a good balance between security and user convenience

**Why OTP email verification over magic links or OAuth?**
- OTP codes are simpler to implement and more reliable across email clients (some block link tracking)
- Users can type the 6-digit code directly — no redirect flows or popup windows
- Supports three purposes (register, login, reset) with the same mechanism, reducing code duplication
- OTP records auto-expire after 15 minutes using MongoDB TTL indexes, ensuring security without manual cleanup
- Works on all devices — users can receive the code on their phone and type it on their laptop

---

### Email Service — SendGrid (Twilio)

| Technology | Purpose |
|-----------|---------|
| **@sendgrid/mail** | Transactional email delivery via HTTPS API |

**Why SendGrid over Nodemailer (SMTP), Brevo, or Resend?**

This was a critical decision driven by production deployment constraints. We evaluated multiple options:

| Service | Issue | Verdict |
|---------|-------|---------|
| **Nodemailer + Gmail SMTP** | Works locally, but Railway (our hosting platform) blocks SMTP ports (25, 465, 587) at the network level | ❌ Blocked in production |
| **Brevo (Sendinblue)** | Requires manual account activation with phone verification and a review process that takes 24-48 hours | ❌ Too slow to activate |
| **Resend** | Free tier only allows sending to the account owner's email address — useless for a multi-user app | ❌ Can't send to other users |
| **SendGrid (Twilio)** | Free tier (100 emails/day), instant activation, uses HTTPS API (port 443) which works everywhere | ✅ **Chosen** |

**Key advantages of SendGrid:**
- **HTTPS-based API** — uses port 443 (standard HTTPS), bypasses Railway's SMTP port blocking entirely
- **Instant setup** — create account, verify sender, get API key, and start sending within minutes
- **Free tier** — 100 emails/day is more than sufficient for a team management app
- **Anti-spam features** — supports disabling click/open tracking (which trigger spam filters), plain text alternatives, and proper reply-to headers
- **Official Node.js SDK** — `@sendgrid/mail` provides a clean, promise-based API with detailed error responses
- **Reliable delivery** — Twilio's infrastructure ensures high deliverability rates

**Anti-spam measures implemented:**
- Plain text + HTML multipart emails (reduces spam score)
- Click tracking and open tracking disabled (tracking links trigger spam filters)
- Proper `replyTo` header matching the sender
- Clean, non-promotional subject lines

---

### Deployment — Railway

| Technology | Purpose |
|-----------|---------|
| **Railway** | Cloud hosting platform with automatic deployments |
| **nixpacks.toml** | Build configuration for Railway |

**Why Railway over Vercel, Render, or Heroku?**
- **Full-stack support** — Railway runs both the Express backend and serves the React frontend from the same service, unlike Vercel which is primarily frontend-focused
- **Automatic deployments** — push to GitHub and Railway rebuilds and deploys automatically
- **Free tier** — $5 credit/month with no credit card required, sufficient for a project of this scale
- **Built-in environment variables** — secure dashboard for managing secrets like API keys and database URIs
- **Custom domains** — supports custom domains with automatic SSL certificates
- **`RAILWAY_PUBLIC_DOMAIN`** — automatically provides the public URL as an environment variable, which we use for the keep-alive self-ping

**Keep-alive mechanism:**
Railway's free tier puts services to sleep after ~15 minutes of inactivity. We solve this with a built-in self-ping that hits the `/api/health` endpoint every 12 minutes, keeping the server awake 24/7 without any external cron service.

---

### Validation — express-validator

**Why express-validator over Joi or Yup?**
- Designed specifically for Express.js — integrates directly as middleware in route definitions
- Declarative validation chains (`.isEmail()`, `.isLength()`, `.isIn()`) are readable and self-documenting
- Built-in sanitization (`.trim()`, `.toLowerCase()`) prevents dirty data from reaching the database
- No additional setup — works out of the box with Express's request object

---

### UI Design — Custom CSS with Dark Theme

**Why custom CSS over Tailwind CSS or Material UI?**
- Full control over the design system — custom dark theme with glassmorphism effects, gradient accents, and smooth animations
- No additional build dependencies or configuration overhead
- Smaller bundle size compared to component libraries like Material UI
- Design matches the modern, premium aesthetic expected from a professional project management tool

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
│   │   └── sendEmail.js        # SendGrid email (OTP + welcome templates)
│   ├── seed.js                 # Initial admin account seeder
│   ├── index.js                # Server entry point + keep-alive ping
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

### Health Check

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Server status and config check | No |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB Atlas cluster (free tier works)
- SendGrid account with a verified sender email (free tier — 100 emails/day)

### Installation

```bash
# Clone the repository
git clone https://github.com/SATVIK202004/team-task-manager.git
cd team-task-manager

# Install all dependencies (server + client)
npm run install:all
```

### Environment Setup

Create a `.env` file inside the `server/` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender@gmail.com
```

#### Getting a SendGrid API Key

1. Create a free account at [sendgrid.com](https://sendgrid.com)
2. Go to **Settings → Sender Authentication → Single Sender Verification** and verify your email
3. Go to **Settings → API Keys → Create API Key** with Full Access or Mail Send permission
4. Copy the key (starts with `SG.`) and add it to your `.env`

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
4. Add the following environment variables in Railway dashboard:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | Your JWT secret key |
   | `NODE_ENV` | `production` |
   | `SENDGRID_API_KEY` | Your SendGrid API key (starts with `SG.`) |
   | `SENDGRID_FROM_EMAIL` | Your verified sender email |

5. Deploy — Railway handles the build and start automatically

> **Note:** `RAILWAY_PUBLIC_DOMAIN` is set automatically by Railway — no manual configuration needed. The keep-alive mechanism uses this variable to ping itself.

### Keep-Alive

The server includes a built-in **self-ping mechanism** that prevents Railway from putting the service to sleep during inactivity. In production, it pings the `/api/health` endpoint every 12 minutes using the `RAILWAY_PUBLIC_DOMAIN` variable. No external cron job or third-party service is required.

### Build Process

1. Installs both server and client dependencies (`npm run install:all`)
2. Builds the React frontend with Vite (`npm run build`)
3. Starts the Express server (`npm start`), which serves the built frontend as static files in production

---

## Database Schema

```
User
├── name (String)
├── email (String, unique)
├── password (String, hashed with bcryptjs)
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
├── code (String, 6-digit)
├── purpose (register | login | reset)
└── expiresAt (Date, TTL index — auto-deletes expired records)
```

---

## Architecture Decisions Summary

| Decision | Chosen | Alternatives Considered | Reason |
|----------|--------|------------------------|--------|
| Frontend framework | React 19 + Vite | Angular, Vue, CRA | Fastest dev experience, largest ecosystem, CRA deprecated |
| Backend framework | Express.js | Django, Flask, Spring Boot | Full-stack JS, lightweight, non-blocking I/O |
| Database | MongoDB Atlas | PostgreSQL, MySQL | Flexible schema, free cloud hosting, JSON-native |
| Auth strategy | JWT + OTP | Sessions, OAuth, Magic Links | Stateless, works with SPAs, simple multi-purpose OTP |
| Email provider | SendGrid | Nodemailer/SMTP, Brevo, Resend | HTTPS API bypasses SMTP blocking, instant activation |
| Hosting | Railway | Vercel, Render, Heroku | Full-stack support, auto-deploy, free tier |
| CSS approach | Custom CSS | Tailwind, Material UI | Full design control, smaller bundle, premium dark theme |
| Validation | express-validator | Joi, Yup | Native Express integration, declarative chains |

---

## Author

**Satvik Peddisetty**

---

## License

MIT
