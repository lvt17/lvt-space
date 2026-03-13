<div align="center">

# 🚀 Lvt Space — Workspace Suite

### *Your All-in-One Productivity Workspace*

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-lvtspace.me-7c5cbf?style=for-the-badge)](https://lvtspace.me)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3fcf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

<br />

**Lvt Space** is a modern, full-stack productivity platform designed for managing tasks, tracking income, taking notes on a canvas, and organizing daily routines — all wrapped in a beautiful, theme-aware interface with **6 color palettes** and **3 display modes**.

<br />

</div>

---

## ✨ Features

### 📊 Dashboard
> Real-time overview of your workspace — income charts, task statistics, daily progress, and quick-access shortcuts.

- **Income tracking** with interactive Recharts line/bar graphs
- **Task completion stats** with progress indicators
- **Daily checklist summary** — see today's progress at a glance
- Responsive card-based layout with glassmorphism design

### ✅ Task Management
> Full CRUD operations with priorities, statuses, and smart filtering.

- Create, edit, delete, and archive tasks
- **Status workflow**: Chờ xử lý → Đang làm → Hoàn thành
- **Priority levels**: Cao / Trung bình / Thấp with color-coded labels
- Search, filter by status/priority, and sort by date
- Inline editing with real-time Supabase sync

### 🎨 Checklist Canvas (Note)
> A freeform canvas for drag-and-drop sticky notes with AI-powered content generation.

- **Drag & drop** — freely position notes on an infinite canvas
- **Resize** — adjust note dimensions by dragging corners
- **Pin/Unpin** — lock important notes in place
- **AI Note Generation** — powered by HuggingFace Router API
- Color-coded note categories (green, amber, red, blue, purple)
- Export and share functionality

### 📅 Daily Checklist
> Track daily habits and recurring tasks with completion streaks.

- Add, complete, and remove daily items
- Visual completion percentage
- Date-based filtering — review past days

### 💰 Income Tracking
> Log and visualize income records with monthly breakdowns.

- Add income entries with source, amount, and date
- Monthly aggregation and trend visualization
- Currency formatting (VND)

### ⚙️ Settings (6 Tabs)
> Comprehensive settings with app-style mobile navigation.

| Tab | Description |
|-----|-------------|
| 🎨 **Giao diện** | 3 display modes (Sáng / Tối / Hệ thống) + 6 color palettes |
| 👤 **Hồ sơ** | Display name, avatar, email management |
| 🔒 **Bảo mật** | Password change, session management |
| 📋 **Cập nhật** | Version history and changelog |
| 💜 **Credits** | Technology stack and attributions |
| ⚠️ **Nâng cao** | Data management and danger zone actions |

### 🔐 Authentication
> Secure auth powered by Supabase with multiple providers.

- Email / Password sign-up and sign-in
- **Google OAuth** and **GitHub OAuth** integration
- Password reset via email
- Protected routes with automatic redirect

---

## 🎨 Theme System

Lvt Space features a sophisticated **runtime theme engine** that dynamically applies CSS variables — no page reload needed.

### Display Modes
| Mode | Behavior |
|------|----------|
| ☀️ **Sáng** | Pure white surfaces, lightest palette tints |
| 🌙 **Tối** | Deep Catppuccin-inspired dark with subtle palette glow |
| 💻 **Hệ thống** | Automatically follows OS light/dark preference |

### Color Palettes
| Palette | Primary | Style |
|---------|---------|-------|
| 💜 Tím | `#C264FF` | Default — vibrant purple |
| 🔵 Biển | `#4A9EFF` | Ocean blue |
| 🟢 Ngọc | `#36B49F` | Emerald green |
| 🔴 Hồng | `#FF6B8A` | Rose / Coral |
| 🟡 Vàng | `#F5A623` | Warm amber |
| ⚫ Đơn sắc | `#8B8B8B` | Minimalist grayscale |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.0 | UI library with latest concurrent features |
| **TypeScript** | 5.7 | Type-safe development |
| **Vite** | 6.0 | Lightning-fast build tool & HMR |
| **Tailwind CSS** | 4.0 | Utility-first CSS with CSS-first config |
| **React Router** | 7.1 | Client-side routing (SPA) |
| **Recharts** | 2.15 | Data visualization & charts |
| **React Icons** | 5.6 | Icon library (Feather, Lucide) |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Express** | 5.0 | REST API server |
| **Supabase** | 2.99 | Auth, PostgreSQL database, RLS |
| **PostgreSQL** | — | Primary data store via Supabase |
| **JWT** | 9.0 | Token-based API authentication |
| **HuggingFace** | — | AI note generation (Router API) |

### Infrastructure
| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting + Serverless API functions |
| **Supabase Cloud** | Managed PostgreSQL + Auth + Realtime |

---

## 📁 Project Structure

```
lvt-space/
├── api/                    # Vercel serverless API wrapper
│   └── index.ts
├── public/                 # Static assets (icons, images)
│   ├── pin-active.png
│   └── pin-normal.png
├── server/                 # Express backend
│   ├── index.ts            # Server entry point
│   ├── auth.ts             # JWT authentication middleware
│   ├── db.ts               # Supabase database client
│   ├── migrate.ts          # Database migration script
│   └── routes/
│       ├── tasks.ts        # Task CRUD endpoints
│       ├── income.ts       # Income tracking endpoints
│       ├── dailyTasks.ts   # Daily checklist endpoints
│       └── ai.ts           # HuggingFace AI integration
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx    # Main app shell
│   │   │   ├── Header.tsx       # Top navigation bar
│   │   │   └── Sidebar.tsx      # Side navigation
│   │   └── ui/
│   │       └── SpaceLogo.tsx    # Animated SVG logo
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Supabase auth provider
│   │   └── ThemeContext.tsx     # Theme engine (6 palettes, 3 modes)
│   ├── data/
│   │   └── mockData.ts         # Navigation items & sample data
│   ├── pages/
│   │   ├── LoginPage.tsx        # Auth page (login/signup/reset)
│   │   ├── DashboardPage.tsx    # Main dashboard
│   │   ├── TaskManagementPage.tsx
│   │   ├── ChecklistPage.tsx    # Canvas with drag & drop
│   │   ├── DailyChecklistPage.tsx
│   │   ├── IncomeReceivedPage.tsx
│   │   ├── SettingsPage.tsx     # 6-tab settings
│   │   └── ResetPasswordPage.tsx
│   ├── services/
│   │   ├── api.ts              # API service layer
│   │   └── supabase.ts         # Supabase client init
│   ├── types/
│   │   └── index.ts            # Shared TypeScript interfaces
│   ├── utils/
│   │   └── currency.ts         # Currency formatting
│   ├── App.tsx                 # Root component + routing
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles + Tailwind config
├── supabase/
│   └── migration_add_user_id.sql
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vercel.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **npm** ≥ 9.0
- A **Supabase** project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/lvt17/lvt-space.git
cd lvt-space
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
HUGGINGFACE_API_KEY=your_hf_api_key
```

### 4. Run database migrations

```bash
npm run migrate
```

### 5. Start development server

```bash
npm run dev
```

This starts both the **Vite dev server** (port 5173) and the **Express API** (port 3001) concurrently.

### 6. Build for production

```bash
npm run build
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set environment variables in Vercel dashboard
3. Deploy — Vercel auto-detects Vite and builds accordingly
4. The `vercel.json` handles SPA routing rewrites

```bash
# Or deploy manually via CLI
vercel --prod
```

---

## 📱 Responsive Design

Lvt Space is fully responsive across all devices:

| Breakpoint | Layout |
|-----------|--------|
| **Desktop** (≥1280px) | Full sidebar + content area |
| **Tablet** (768-1279px) | Collapsible sidebar overlay |
| **Mobile** (< 768px) | Bottom-sheet sidebar + app-style tab navigation |

The **Settings page** uses an iOS-style navigation pattern on mobile — tap a category to drill into its content with a back button.

---

## 🔒 Security

- **Row Level Security (RLS)** — each user can only access their own data
- **JWT authentication** for API endpoints
- **Supabase Auth** with secure session management
- **CORS** configured for production domains
- **Environment variables** for all secrets (never committed)

---

## 📄 License

This project is private and not licensed for redistribution.

---

<div align="center">

**Built with 💜 by [Lieu Vinh Toan](https://github.com/lvt17)**

*Lvt Space — Where productivity meets aesthetics.*

</div>
