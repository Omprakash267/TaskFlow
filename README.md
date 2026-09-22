# TaskFlow

[![Build APK](https://github.com/YOUR_USERNAME/todo-app/actions/workflows/build-apk.yml/badge.svg)](https://github.com/YOUR_USERNAME/todo-app/actions/workflows/build-apk.yml)

A modern, production-ready task management application built with React, Local-first Storage Engine, and Capacitor for Android.

## 📥 Download & Install

### Android APK

1. Go to the [**Releases**](https://github.com/YOUR_USERNAME/todo-app/releases/latest) page
2. Download **`TaskFlow.apk`**
3. Open the APK on your Android device
4. If prompted, enable **"Install from unknown sources"** in your device settings
5. Tap **Install** and you're ready to go!

> **Note:** Since the APK is not from the Play Store, Android may show a security warning. This is normal for sideloaded apps. The app is fully open-source — you can review the code yourself.

### Web Version

You can also use TaskFlow directly in your browser:

```bash
git clone https://github.com/YOUR_USERNAME/todo-app.git
cd todo-app
npm install
npm run dev
```

Opens at http://localhost:5173

## Features

- **Authentication**: Local multi-user account registration, login, logout, password reset, and session persistence
- **Task Management**: Add, Edit, Delete tasks with confirmation dialogs
- **Checklist & Subtasks**: Break down tasks into checklist items with interactive check-off, progress bars, and percentage tracking
- **Quick Scratchpad**: Instant dashboard checklist for fleeting thoughts, quick subtasks, bulk completion, and 1-click conversion to tasks
- **Task Organization**: Categories (Study, Work, Personal, Shopping, Other) with custom badges
- **Priority Levels**: High, Medium, Low with visual indicators
- **Due Dates**: Date picker with overdue detection
- **Search**: Real-time debounced search across title, description, and category
- **Filtering**: All, Today, Upcoming, Overdue, Completed, Pending, High Priority
- **Sorting**: By creation date, due date, priority, or status
- **Statistics Dashboard**: Completion rate, weekly chart, category breakdown
- **Dark Mode**: Light, Dark, and System preference with persistence
- **Reminders**: Local notifications via Capacitor (Android)
- **Offline & Local-First**: 100% self-contained local storage engine with zero server configuration
- **Real-time Reactive Sync**: Instant reactive event emitter updates across components and tabs
- **Profile Management**: Display name, password change, account deletion
- **Mobile-first UI**: Responsive design with bottom navigation
- **Android App**: Capacitor-powered installable APK

## Tech Stack

| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| Vite 5 | Fast build tool & dev server |
| Local Storage Engine | Local-first reactive multi-user database |
| Capacitor 8 | Native Android wrapper |
| CSS3 | Custom design system & dark mode |
| GitHub Actions | Automated APK builds |

## Project Structure

```
taskflow/
├── .github/workflows/          # CI/CD (auto-build APK)
├── android/                    # Android native project (Capacitor)
├── dist/                       # Production build output
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── BottomNav.jsx       # Bottom navigation bar
│   │   ├── ConfirmDialog.jsx   # Delete confirmation modal
│   │   ├── EmptyState.jsx      # Empty state display
│   │   ├── FilterBar.jsx       # Filter chips + sort dropdown
│   │   ├── Header.jsx          # Page header
│   │   ├── Loading.jsx         # Loading spinner
│   │   ├── ProtectedRoute.jsx  # Auth guard for routes
│   │   ├── SearchBar.jsx       # Search input
│   │   ├── StatCard.jsx        # Statistics card
│   │   ├── TaskCard.jsx        # Task list item
│   │   ├── TaskForm.jsx        # Add/Edit task form
│   │   └── TaskList.jsx        # Task list container
│   ├── constants/
│   │   └── index.js            # Categories, priorities, filters
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state
│   │   └── ThemeContext.jsx    # Theme state (light/dark/system)
│   ├── hooks/
│   │   ├── useNotifications.js # Notification permissions
│   │   ├── useOnlineStatus.js  # Online/offline detection
│   │   └── useTodos.js         # Todo state + search/filter/sort
│   ├── pages/
│   │   ├── ForgotPassword.jsx  # Password reset page
│   │   ├── Home.jsx            # Dashboard with stats
│   │   ├── Login.jsx           # Login page
│   │   ├── Settings.jsx        # Settings & profile
│   │   ├── Signup.jsx          # Registration page
│   │   ├── Statistics.jsx      # Productivity statistics
│   │   └── Tasks.jsx           # Full task list
│   ├── services/
│   │   ├── authService.js      # Local authentication operations
│   │   ├── localDb.js          # Reactive local database engine
│   │   ├── notificationService.js # Local notifications
│   │   ├── todoService.js      # Task CRUD operations
│   │   └── userService.js      # User profile management
│   ├── styles/                 # Modular CSS
│   ├── utils/
│   │   └── helpers.js          # Date, validation, filtering utils
│   ├── App.jsx                 # Root component with routing
│   └── main.jsx                # Entry point
├── capacitor.config.json       # Capacitor configuration
├── index.html
├── package.json
├── PRIVACY_POLICY.md           # Privacy policy
├── vite.config.js
└── README.md
```

## Setup & Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Opens at http://localhost:5173

## Building the APK

### Automatic (via GitHub Actions)

Every push to `main` automatically builds the APK. Tagged releases (e.g., `v1.0.0`) also publish the APK to GitHub Releases.

```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0
```

The APK will appear in the [Releases](https://github.com/YOUR_USERNAME/todo-app/releases) page.

### Manual (Local Build)

#### Prerequisites
- Node.js 18+
- Java JDK 17+
- Android SDK (via Android Studio)

#### Build Steps

```bash
# 1. Build web assets and sync to Android
npm run cap:build

# 2. Build the debug APK
cd android
./gradlew assembleDebug
```

The APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Open in Android Studio

```bash
npm run cap:open
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run cap:build` | Build and sync web bundle to Android |
| `npm run cap:sync` | Sync web build to Android |
| `npm run cap:open` | Open project in Android Studio |

## Privacy

TaskFlow is 100% local-first. No data is collected, stored on servers, or transmitted anywhere. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details.

## License

MIT