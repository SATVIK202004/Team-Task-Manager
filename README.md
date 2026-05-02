# TaskFlow — Team Task Manager

TaskFlow is a full-stack team task management app I built to streamline how small teams organize their projects and track work. It supports two roles — Admins who create projects and manage teams, and Members who handle their assigned tasks. The entire auth flow uses email-based OTP codes, so there are no passwords flying around in plain text after the initial login.

**Live:** [team-task-manager-production-9c87.up.railway.app](https://team-task-manager-production-9c87.up.railway.app)

---

## What It Looks Like

**Login & OTP Verification** — Two-step auth with a 6-digit code sent to your email.

![Login Page](client/public/screenshots/login.png)
![OTP Verification](client/public/screenshots/otp-verification.png)

**Dashboard** — At a glance: how many tasks are pending, in progress, done, or overdue.

![Dashboard](client/public/screenshots/dashboard.png)

**Projects** — Create workspaces, invite people by email, and keep things organized.

![Projects](client/public/screenshots/projects.png)

**Tasks** — The core of the app. Assign work, set priorities, track deadlines.

![Tasks](client/public/screenshots/tasks.png)

---

## What You Can Do

- Sign up and log in with email OTP verification
- Reset your password if you forget it (also via OTP)
- Get a welcome email when your account is verified
- Create, edit, and delete projects
- Invite team members to a project using their email
- Create tasks with a title, description, priority level, due date, and assignee
- Move tasks through the workflow: **To Do → In Progress → Done**
- See overdue tasks highlighted automatically
- Filter and search tasks by project, status, priority, or keyword
- View dashboard stats — totals, breakdowns, and alerts

### Who Can Do What

| Action | Admin | Member |
|--------|:-----:|:------:|
| Create or delete projects | ✔ | ✘ |
| Add or remove team members | ✔ | ✘ |
| Create tasks | ✔ | ✔ |
| Update task status | ✔ | ✔ (own/assigned) |
| Delete tasks | ✔ | ✔ (own only) |
| View dashboard | ✔ | ✔ |

---

## Known Issue: OTP Emails Landing in Spam

Since we're sending transactional emails from a `gmail.com` address through SendGrid's servers, some email providers (especially Gmail itself) may route the OTP emails to the **Spam** or **Promotions** folder. This happens because the sending server (SendGrid) doesn't match Gmail's SPF/DKIM records for the `gmail.com` domain.

**What to do if you don't see the OTP in your inbox:**
1. Check your **Spam** folder
2. Mark the email as "Not Spam" — future emails from TaskFlow should then land in your inbox
3. Optionally, add the sender email to your contacts

**Why not use a custom domain to fix this?**
Custom domain authentication (setting up SPF, DKIM, and DMARC records) would solve this entirely. However, for a project using free-tier services without a purchased domain, single-sender verification with a Gmail address is the practical approach. If this were a production SaaS product, domain authentication would be the first thing to set up.

---

## Tech Stack

Here's what powers the app and, more importantly, *why* I picked each piece.

### Frontend: React 19 + Vite

I went with **React** because the app is essentially a dashboard — lots of reusable components like task cards, project panels, modals, and stat widgets. React's component model handles that naturally. I paired it with **Vite** instead of Create React App because CRA is officially deprecated and Vite starts up in under a second (CRA used to take 15-20 seconds on my machine). **React Router v7** handles navigation and protected routes, and **react-icons** gives me clean Heroicon SVGs without bloat.

I considered Angular but it felt like overkill for this scale — too much boilerplate for a project that doesn't need dependency injection or RxJS observables. Vue was a close second, but React's ecosystem is larger and I'm more productive in it.

### Backend: Node.js + Express.js

Using **Express** on **Node.js** means the entire stack speaks JavaScript. No context switching between Python and JS, no type mismatches between backend responses and frontend consumption. Express is minimal — it doesn't force an ORM, a template engine, or a specific folder structure on you. I get to design the API exactly how I want.

Django or Flask would've worked, but they'd add a language boundary. Spring Boot was never in consideration — it's enterprise-grade tooling for a project that needs to stay lightweight. I use **express-validator** for input sanitization and validation because it plugs directly into route definitions as middleware — cleaner than importing Joi schemas or Yup objects separately.

### Database: MongoDB Atlas

The data in this app — users, projects, tasks, OTPs — maps naturally to documents. A task has a title, a description, a status, a priority, a due date, and references to a project and a user. That's a JSON object. MongoDB stores it as-is, no ORM translation layer needed.

I use **Mongoose** on top for schema enforcement, pre-save hooks (like hashing passwords before storing them), and TTL indexes (OTP records auto-delete after 15 minutes — the database handles expiry, not my code). **MongoDB Atlas** hosts it for free with 512 MB storage, automatic backups, and a dashboard for monitoring queries.

PostgreSQL would've been fine too, but the relational model would've meant writing migrations every time I changed a field. With MongoDB, I just update the schema and move on.

### Authentication: JWT + Email OTP

When a user logs in with valid credentials, the server sends a 6-digit OTP to their email. Once they enter it correctly, they receive a **JWT token** that's valid for 7 days. The token is stateless — the server doesn't store sessions, which means I can scale horizontally without worrying about sticky sessions or a Redis store.

I chose OTP over magic links because links depend on email client behavior (some clients pre-fetch URLs, which can "use up" the link). A 6-digit code that the user types manually is more reliable. I also considered OAuth (Google Sign-In), but that adds a dependency on a third-party auth provider and complicates the flow for a project that's meant to demonstrate full-stack architecture.

Passwords are hashed with **bcryptjs** before storage — never stored in plain text.

### Email: SendGrid (Twilio)

This was the hardest decision and took several iterations to get right. Here's the journey:

**Attempt 1 — Nodemailer + Gmail SMTP:** Worked perfectly on localhost. Broke completely on Railway. Turns out Railway blocks all outbound SMTP ports (25, 465, 587) at the network level on their free tier. Dead end.

**Attempt 2 — Brevo (Sendinblue):** Has an HTTP-based API that bypasses port blocking. Created an account, generated an API key, wrote the integration. But Brevo requires manual account activation — you have to complete a phone verification process and wait for their team to review your account. That takes 24-48 hours. Didn't have that kind of time.

**Attempt 3 — Resend:** Modern email API, great developer experience. One problem: on the free tier, you can only send emails to the email address that owns the account. So I could send OTPs to myself, but not to any other user. Useless for a multi-user app.

**Attempt 4 — SendGrid (Twilio):** Free tier gives 100 emails/day. Account activation is instant — verify your sender email, create an API key, and you're sending emails within minutes. The `@sendgrid/mail` package provides a clean promise-based API. Most importantly, it uses **HTTPS (port 443)** to communicate with SendGrid's servers, which works on Railway and literally every other hosting platform.

**Anti-spam measures I added:**
- Every email includes both HTML and plain text versions (multipart emails score better with spam filters)
- Click tracking and open tracking are disabled — SendGrid's tracking links are a major spam trigger
- The `replyTo` header matches the sender address
- Subject lines are straightforward ("Your TaskFlow login code") rather than promotional

### Hosting: Railway

Railway handles both the backend API and serves the built React frontend from the same service. I deploy by pushing to GitHub — Railway picks up the commit, installs dependencies, builds the client, and starts the server automatically.

I considered Vercel, but it's optimized for serverless frontend deployments. Running a persistent Express server with WebSocket-like keep-alive behavior isn't Vercel's sweet spot. Render was an option but their free tier spins down after 15 minutes and has slower cold starts. Heroku removed their free tier entirely.

**The sleep problem:** Railway's free tier also sleeps services after ~15 minutes of inactivity. I solved this with a self-ping: the server hits its own `/api/health` endpoint every 12 minutes in production. It uses the `RAILWAY_PUBLIC_DOMAIN` environment variable (which Railway sets automatically), so there's no hardcoded URL and no external cron job needed.

### Styling: Custom CSS

I wrote all the styles from scratch — dark theme, glassmorphism cards, gradient accents, hover animations. No Tailwind, no Material UI. The reason is simple: I wanted full control over the visual identity. Component libraries like MUI ship a lot of CSS you don't use, and Tailwind's utility classes can make JSX hard to read when you have 15 classes on a single div. Custom CSS also means a smaller bundle.

---

## Project Structure

```
├── client/                     # React frontend (Vite)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/         # Navbar, ProtectedRoute, Layout
│   │   ├── context/            # AuthContext — JWT storage and user state
│   │   ├── pages/              # Login, Register, ForgotPassword,
│   │   │                       # Dashboard, Projects, ProjectDetail, Tasks
│   │   ├── services/           # Axios API client
│   │   ├── App.jsx             # Route definitions
│   │   └── index.css           # Global styles (dark theme)
│   └── package.json
│
├── server/                     # Express backend
│   ├── config/db.js            # MongoDB Atlas connection
│   ├── middleware/auth.js      # JWT verification, role-based guards
│   ├── models/
│   │   ├── User.js             # name, email, password (hashed), role, isVerified
│   │   ├── Project.js          # name, description, owner, members[]
│   │   ├── Task.js             # title, status, priority, dueDate, assignedTo
│   │   └── OTP.js              # email, code, purpose, expiresAt (TTL)
│   ├── routes/
│   │   ├── auth.js             # Register, login, OTP verify, password reset
│   │   ├── projects.js         # CRUD + member management
│   │   └── tasks.js            # CRUD + dashboard stats aggregation
│   ├── utils/sendEmail.js      # SendGrid integration
│   ├── seed.js                 # Creates default admin on first run
│   ├── index.js                # Entry point + keep-alive self-ping
│   └── package.json
│
├── nixpacks.toml               # Railway build config
├── .gitignore
└── README.md
```

---

## API Endpoints

### Auth

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, sends verification OTP |
| POST | `/api/auth/verify-register` | Confirm OTP, activate account |
| POST | `/api/auth/login` | Validate credentials, sends login OTP |
| POST | `/api/auth/verify-login` | Confirm OTP, returns JWT |
| POST | `/api/auth/forgot-password` | Sends password reset OTP |
| POST | `/api/auth/reset-password` | Verify OTP, set new password |
| POST | `/api/auth/resend-otp` | Resend any OTP (register/login/reset) |
| GET | `/api/auth/me` | Get logged-in user's profile |

### Projects

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/api/projects` | List projects you belong to |
| POST | `/api/projects` | Create a new project (admin only) |
| GET | `/api/projects/:id` | Get project details with members |
| PUT | `/api/projects/:id` | Update project info (admin only) |
| DELETE | `/api/projects/:id` | Delete project and all its tasks (admin only) |
| POST | `/api/projects/:id/members` | Add a member by email (admin only) |
| DELETE | `/api/projects/:id/members/:userId` | Remove a member (admin only) |

### Tasks

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks with optional filters |
| POST | `/api/tasks` | Create a task in a project |
| GET | `/api/tasks/:id` | Get task details |
| PUT | `/api/tasks/:id` | Update task fields |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/tasks/dashboard/stats` | Aggregated stats for the dashboard |

### System

| Method | Endpoint | What It Does |
|--------|----------|-------------|
| GET | `/api/health` | Returns server status and env config check |

---

## Running It Yourself

### You'll Need

- Node.js 18+
- A MongoDB Atlas cluster ([free tier works](https://www.mongodb.com/atlas))
- A SendGrid account ([free — 100 emails/day](https://sendgrid.com))

### Setup

```bash
git clone https://github.com/SATVIK202004/team-task-manager.git
cd team-task-manager
npm run install:all
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=pick_something_random_here
NODE_ENV=development
SENDGRID_API_KEY=SG.your_key_here
SENDGRID_FROM_EMAIL=your_verified_email@gmail.com
```

**To get the SendGrid API key:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Settings → Sender Authentication → verify your sender email
3. Settings → API Keys → Create API Key (Full Access) → copy it

### Run

```bash
npm run dev
```

Opens the backend on `http://localhost:5000` and the frontend on `http://localhost:5173`.

---

## Deploying to Railway

1. Push your code to GitHub
2. Create a project on [railway.app](https://railway.app) and connect the repo
3. Add these environment variables in Railway's dashboard:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URI` | Your MongoDB connection string |
   | `JWT_SECRET` | Any strong random string |
   | `NODE_ENV` | `production` |
   | `SENDGRID_API_KEY` | Your key starting with `SG.` |
   | `SENDGRID_FROM_EMAIL` | Your verified sender email |

4. Deploy. Railway runs `npm run build` (builds the React app) then `npm start` (starts Express).

The keep-alive self-ping activates automatically in production — it reads `RAILWAY_PUBLIC_DOMAIN` (set by Railway) and pings `/api/health` every 12 minutes. No external cron needed.

---

## Database Design

```
User
├── name            String
├── email           String, unique, lowercase
├── password        String, bcrypt-hashed
├── role            "admin" or "member"
└── isVerified      Boolean (true after OTP confirmation)

Project
├── name            String
├── description     String
├── owner           → User (who created it)
└── members         → [User] (who has access)

Task
├── title           String
├── description     String
├── status          "todo" | "in-progress" | "done"
├── priority        "low" | "medium" | "high"
├── dueDate         Date
├── project         → Project
├── assignedTo      → User
└── createdBy       → User

OTP
├── email           String
├── code            String (6 digits)
├── purpose         "register" | "login" | "reset"
└── expiresAt       Date (TTL index — MongoDB auto-deletes after expiry)
```

---

## Decision Summary

For anyone reviewing the architecture, here's a quick reference of every major decision and the reasoning behind it:

| What | Chose | Over | Because |
|------|-------|------|---------|
| UI library | React 19 | Angular, Vue | Best component model for dashboards, largest ecosystem |
| Build tool | Vite | CRA, Webpack | CRA is deprecated, Vite is 10x faster |
| Server | Express.js | Django, Spring Boot | Same language as frontend, minimal boilerplate |
| Database | MongoDB | PostgreSQL | Flexible schemas, no migrations, free Atlas hosting |
| Auth tokens | JWT | Sessions | Stateless, no Redis needed, scales horizontally |
| Verification | Email OTP | Magic links, OAuth | More reliable across email clients, no third-party dependency |
| Email API | SendGrid | Nodemailer, Brevo, Resend | SMTP blocked on Railway; Brevo too slow to activate; Resend can't send to other users |
| Hosting | Railway | Vercel, Render | Full-stack support, auto-deploy from GitHub, free tier |
| Styling | Custom CSS | Tailwind, MUI | Smaller bundle, full design control, premium dark theme |
| Validation | express-validator | Joi, Yup | Native Express middleware, no extra setup |

---

## Author

**Satvik Peddisetty**

## License

MIT
