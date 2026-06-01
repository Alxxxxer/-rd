# Enterprise Sales CRM & Campus Delegate Management Dashboard

A professional, enterprise-grade, high-fidelity Sales CRM and Campus Delegate Arena dashboard. Featuring a fully audited layered architecture, secure role-based data isolation, real-time self-healing metrics recounts, and a state-of-the-art glassmorphic dark-mode interface.

---

## 🌟 Core Modules

### 🔒 Phase 1: Security & Identity Management
* **JWT Authentication & Session Locking**: Session states are signed with secure JWT keys to guarantee bulletproof route guard protections.
* **Encrypted Credentials**: Passwords are securely hashed before DB persistence using robust salt configurations inside the User Mongoose pre-save hook.
* **Protected Wrappers**: Shields pages using strict `<ProtectedRoute>` wrappers in React Router, automatically redirecting unauthenticated sessions.

### 🛡️ Phase 2: Administrative Control & Compliance
* **Access Control Panels**: Custom consoles for `SUPER_ADMIN` and `ADMIN` roles to provision staff accounts and modify system roles.
* **Anti-Privilege Escalation**: Built strict administrative boundaries preventing standard admins from creating or modifying `SUPER_ADMIN` accounts.
* **Compliance Audit Trail**: Captures granular activity trails (user, action, timestamp, metadata) to record compliance events.

### 💼 Phase 3: Prospects & Pipeline Desk
* **Dynamic Data Isolation**: Scopes lead retrievals and searches automatically. Sales Executives can *only* see and manage their own assigned leads.
* **Chronological Comment Streams**: Timeline comments on leads are sorted in descending order (most recent at the top) showing author details and creation timestamps.
* **Administrative Delete Guards**: resticts deletion permissions exclusively to `SUPER_ADMIN` and `ADMIN` roles.

### 🏆 Phase 4: Campus Delegate Network & Competitor Arena
* **Delegate Provisioning**: Links staff accounts to active Campus profiles using campus codes and uppercase tags.
* **Self-Healing Statistics Recounts**: Whenever a lead's status is modified (e.g. converted to `CONVERTED`) or deleted, a background recounter recalculates and syncs that delegate's total assigned and converted statistics.
* **Competitor Podium Leaderboard**: A stunning ranked podium layout highlighting the top 3 delegates with Gold (🏆), Silver (🥈), and Bronze (🥉) glowing outline rings, custom crowns, and hover animations, followed by a challengers leaderboard table.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Query (TanStack), React Router 6, TailwindCSS / HSL Dark-Theme CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), Joi Payload Validators |
| **Database** | MongoDB, Mongoose ODM (Object Document Mapper) |
| **Tooling** | Nodemon, Git, npm |

---

## 📁 System Architecture

```text
bada pro/
├── client/                     # High-fidelity React Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Layout.jsx, Sidebar.jsx, LeadDrawerModal.jsx
│   │   │   └── ui/             # Reusable UI Atoms (Card, Button, Input, Modal)
│   │   ├── context/            # AuthContext.jsx
│   │   ├── pages/              # Delegates.jsx, Leaderboard.jsx, Leads.jsx, Users.jsx, Login.jsx
│   │   └── services/           # api.js Axios custom instances
│   ├── tailwind.config.js      # Styling tokens
│   └── package.json            # Client configurations
│
└── server/                     # Layered Express API Service
    ├── src/
    │   ├── config/             # env.js, db.js connection configurations, seed.js
    │   ├── constants/          # Role codes, Status codes
    │   ├── controllers/        # DelegateController.js, LeadController.js, UserController.js
    │   ├── middlewares/        # authMiddleware.js, validationMiddleware.js
    │   ├── models/             # User.js, Lead.js, Delegate.js
    │   ├── repositories/       # LeadRepository.js, DelegateRepository.js, UserRepository.js
    │   └── services/           # LeadService.js, DelegateService.js, UserService.js
    └── package.json            # Server configurations
```

---

## 🚀 Installation & Local Environment Setup

### Prerequisites
* **Node.js**: `v18.x` or higher
* **MongoDB**: A running local MongoDB community server or Mongo Atlas cluster connection.

### Step 1: Clone & Initialize the Project
Initialize git locally inside the root folder:
```bash
git init
```

### Step 2: Configure Environment Variables
Create a `.env` file inside the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sales_crm
JWT_SECRET=super_secret_jwt_key_signature_123!
SUPER_ADMIN_EMAIL=superadmin@salescrm.com
SUPER_ADMIN_PASSWORD=Admin@123456
```

### Step 3: Seed the Super Admin Account
Navigate to the `server` folder, install dependencies, and run the MongoDB database seeding script:
```bash
cd server
npm install
npm run seed
```

### Step 4: Launch the API Server
Start the Express server under Nodemon development monitoring:
```bash
npm run dev
```
*Observe: console logs showing `[DATABASE] MongoDB Connected successfully` on port 5000.*

### Step 5: Launch the React Client
Open a second terminal window, navigate to the `client` directory, install packages, and spin up the Vite server:
```bash
cd client
npm install
npm run dev
```
*Observe: server launches on `http://localhost:5173/`.*

---

## 🛡️ Production-Grade Engineering Patterns

### 1. Repository-Service Separation
The server splits data operations and business rules into decoupled modules:
* **Mongoose Models**: Defines schemas and static database indexing parameters.
* **Repositories**: Isolates pure CRUD DB queries (e.g. `.populate()`, sorting, database parameters).
* **Services**: Encapsulates all role permissions, isolation policies, and synchronization recounts.

### 2. Preventing Circular Dependency Lockups
To prevent Node process locking during stats synchronization:
* Dynamic `require('./DelegateService')` calls are executed within localized class methods inside `LeadService.js`.
* Keeps imports fully decoupled during initialization loops.

### 3. High-Performance Indexing
* **Scoped lookups**: Created composite compound index on `{ assignedTo: 1, status: 1 }` inside `Lead.js`.
* **Stats calculation**: Created composite compound index on `{ delegate: 1, status: 1 }` inside `Lead.js` to ensure live recounts complete in sub-millisecond execution times.

---

## 👥 Seeded Credentials for Testing

* **Email Address**: `superadmin@salescrm.com`
* **Secure Password**: `Admin@123456`
* **Clearance Status**: `SUPER_ADMIN` (All panels visible, delegate links active, audit logs viewable).
