# 📱 TaskFlow — Complete Technical Documentation & Codebase Master Guide

---

## 1. Project Overview & Specifications

* **Application Name**: `TaskFlow`
* **Package / Application ID**: `com.taskflow.app`
* **Version**: `2.0.0`
* **Application Type**: Mobile-First Progressive Productivity Application & Installable Android App
* **Architecture**: Local-First Reactive Single-Page Application (SPA)
* **Target Platforms**: Android (APK/AAB via Capacitor), Web Browsers (Chrome, Edge, Firefox, Safari, Mobile Browsers)
* **Repository Location**: `e:\todo-app`

---

## 2. Technology Stack & Dependencies

### Core Framework & Build Tools
* **React 18.2.0**: Component-driven UI library utilizing React Hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useContext`, `createContext`).
* **React DOM 18.2.0**: Virtual DOM renderer for browser and WebView environments.
* **Vite 5.4.1**: Next-generation frontend build tool with ES module support, Hot Module Replacement (HMR), and Rollup-based production minification.
* **@vitejs/plugin-react 4.3.4**: Babel/SWC integration for JSX transformation and fast refresh.
* **React Router DOM 7.18.3**: Client-side declarative routing and protected route management.

### Mobile Runtime (Capacitor)
* **@capacitor/core 8.5.0**: Native bridge runtime connecting web JavaScript to native Android APIs.
* **@capacitor/android 8.5.0**: Android native platform library and Gradle build scaffolding.
* **@capacitor/cli 8.5.0**: Command-line toolchain for building, syncing, and opening native platforms.
* **@capacitor/app 8.1.1**: Native app lifecycle and hardware Android back-button listener.
* **@capacitor/local-notifications 8.3.1**: Native scheduling and dispatch of task reminder notifications.
* **@capacitor/network 8.0.1**: Real-time device internet connectivity detection.
* **@capacitor/splash-screen 8.0.2**: Native launch splash screen controller.
* **@capacitor/status-bar 8.0.3**: Android status bar appearance, overlay, and color styling.

### Design & Styling
* **Vanilla CSS3 Custom Properties**: Design token architecture with dynamic light/dark theming and zero CSS-in-JS runtime overhead.
* **Google Fonts (Inter)**: Clean typography designed for mobile legibility (`400`, `500`, `600`, `700` weights).

---

## 3. Architecture & Data Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Device / Web Browser Display                    │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                             index.html
                                    │
                                    ▼
                              src/main.jsx
                   ┌────────────────┴────────────────┐
                   ▼                                 ▼
           ThemeProvider                     AuthProvider
      (Light/Dark/System)                 (Session & User)
                   └────────────────┬────────────────┘
                                    │
                                    ▼
                               src/App.jsx
              (Route Switcher & Android Back Button Handler)
                                    │
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
   Public Routes                                       Protected Routes
 ┌──────────────────────┐                     ┌───────────────────────────────┐
 │ /login               │                     │ / (Home Dashboard)            │
 │ /signup              │                     │ /tasks (Task Manager)         │
 │ /forgot-password     │                     │ /statistics (Analytics)       │
 └──────────────────────┘                     │ /settings (Profile & Config)  │
                                              └───────────────────────────────┘
                                                              │
                                                              ▼
                                                   src/components/BottomNav
                                            (Home | Tasks | Stats | Settings)
                                                              │
                                                              ▼
                                                 src/hooks/useTodos.js
                                                              │
                                                              ▼
                                              src/services/todoService.js
                                                              │
                                                              ▼
                                               src/services/localDb.js
                                           (Reactive Event Emitter Engine)
                                                              │
                                                              ▼
                                                 Device LocalStorage
```

---

## 4. Complete File-by-File Technical Directory

### 4.1 Project Root Files

#### `package.json`
* Defines project metadata, dependencies, devDependencies, and custom scripts:
  * `npm run dev`: Starts local Vite development server at `http://localhost:5173`.
  * `npm run build`: Bundles the React application into optimized static assets in `/dist`.
  * `npm run preview`: Spins up a local web server to test the `/dist` production build.
  * `npm run cap:sync`: Syncs `/dist` assets and configuration into the native `android/` directory.
  * `npm run cap:open`: Launches Android Studio with the `android/` project.
  * `npm run cap:build`: One-step command running `vite build && cap sync`.

#### `vite.config.js`
* Located at the project root.
* Configures React plugin, output directory (`dist`), source maps (`false` for production), and server port (`5173`).

#### `capacitor.config.json`
* Configuration file for the Capacitor CLI:
  * `appId`: `"com.taskflow.app"`
  * `appName`: `"TaskFlow"`
  * `webDir`: `"dist"`
  * `server.androidScheme`: `"https"`
  * `plugins.SplashScreen`: 2000ms duration, auto-hide, brand color background (`#6366f1`).
  * `plugins.StatusBar`: dark style, background color (`#6366f1`).
  * `plugins.LocalNotifications`: configured with notification small icon and accent color.

#### `index.html`
* Application entry HTML.
* Viewport configured with `viewport-fit=cover` and `user-scalable=no` to prevent awkward double-tap zooms on mobile screens.
* Meta `theme-color` set to `#6366f1` for native mobile browser header matching.

#### `.gitignore`
* Excludes `node_modules/`, `dist/`, `.env*`, `android/app/build/`, `android/.gradle/`, `*.apk`, and `*.aab`.

#### `README.md`
* Complete developer setup guide, feature matrix, and build instructions.

---

### 4.2 Services Layer (`src/services/`)

#### `src/services/localDb.js`
* **Core Engine**: A local-first storage engine that provides multi-user isolation, persistent browser/device storage, and real-time reactive event subscriptions.
* **`LocalEventEmitter` Class**:
  * `on(event, callback)`: Registers a listener function for a named event and returns an unsubscribe function.
  * `off(event, callback)`: Removes a listener.
  * `emit(event, data)`: Notifies all active subscribers with payload data.
* **Storage Keys**:
  * `todo_app_users`: Array of user records.
  * `todo_app_session`: Active logged-in user session.
  * `todo_app_todos`: Array of all task items.
  * `todo_app_profiles`: Object of user profile data keyed by `userId`.
* **Exported Utilities**:
  * `dbEvents`: Shared instance of `LocalEventEmitter`.
  * `getStorageItem(key, defaultValue)`: Safe JSON parsing wrapper with error handling.
  * `setStorageItem(key, value)`: Safe JSON stringification wrapper.
  * `generateId(prefix)`: Generates collision-resistant unique identifiers (e.g. `task_1740812345678_k9a2bc1d`).

#### `src/services/authService.js`
* **`signupUser(email, password)`**:
  * Normalizes email to lowercase.
  * Checks if email already exists in `todo_app_users`; throws `auth/email-already-in-use` if duplicate.
  * Creates new user object with unique `uid`, stores in `todo_app_users`, sets `todo_app_session`, and emits `"auth_change"`.
* **`loginUser(email, password)`**:
  * Finds matching email and password in `todo_app_users`; throws `auth/invalid-credential` if incorrect.
  * Sets active session in `todo_app_session` and emits `"auth_change"`.
* **`logoutUser()`**:
  * Clears `todo_app_session` from storage and emits `"auth_change"` with `null`.
* **`onAuthChange(callback)`**:
  * Immediately fires callback with `getCurrentUser()`, then registers for future `"auth_change"` events. Returns an unsubscribe function.
* **`getCurrentUser()`**:
  * Returns the active session object `{ uid, email, displayName }` or `null`.
* **`resetPassword(email)`**:
  * Verifies email exists in local accounts.
* **`updateUserDisplayName(displayName)`**:
  * Updates display name in both user record and current session; emits `"auth_change"`.
* **`deleteUserAccount()`**:
  * Deletes user from `todo_app_users`, deletes all tasks where `userId === current.uid`, deletes user profile, and calls `logoutUser()`.

#### `src/services/todoService.js`
* **`subscribeToTodos(userId, callback)`**:
  * Queries `todo_app_todos` filtered strictly by `userId`.
  * Sorts tasks by `createdAt` descending.
  * Immediately invokes callback with normalized task items.
  * Listens to `"todos_change"` event and re-filters for the active user whenever any task is created, updated, or deleted. Returns unsubscribe function.
* **`createTodo(userId, taskData)`**:
  * Generates unique task ID (`task_...`).
  * Normalizes fields (title, description, category, priority, dueDate, reminderTime, completed: false, createdAt ISO, updatedAt ISO).
  * Prepends task to `todo_app_todos` and emits `"todos_change"`. Returns `{ id }`.
* **`updateTodo(id, updatedData)`**:
  * Finds task by ID, applies partial updates, updates `updatedAt` ISO timestamp, and emits `"todos_change"`.
* **`deleteTodo(id)`**:
  * Removes task from `todo_app_todos` and emits `"todos_change"`.
* **`toggleTodoComplete(todo)`**:
  * Toggles `completed` boolean property via `updateTodo`.

#### `src/services/userService.js`
* **`getUserProfile(uid)`**: Returns profile object for specified user ID.
* **`createUserProfile(uid, data)`**: Stores profile info (email, displayName, notificationsEnabled, createdAt) and emits `"profile_change"`.
* **`updateUserProfile(uid, data)`**: Merges partial updates into the profile.

#### `src/services/notificationService.js`
* **Native Capacitor Integration**:
  * Dynamically imports `@capacitor/local-notifications`.
  * `isNotificationAvailable()`: Checks if running on native mobile.
  * `requestNotificationPermission()` / `checkNotificationPermission()`: Requests Android notification permission.
  * `scheduleReminder(task)`: Converts reminder date/time to local notification scheduled event.
  * `cancelReminder(taskId)`: Cancels scheduled notification for a task.

---

### 4.3 Context State Providers (`src/context/`)

#### `src/context/AuthContext.jsx`
* Creates `AuthContext` and exposes `useAuth()` hook.
* **State**:
  * `user`: Current authenticated session `{ uid, email, displayName }`.
  * `profile`: Persistent profile document from `userService`.
  * `loading`: Boolean indicating initial auth check.
* **Methods**:
  * `logout()`: Logs out current user.
  * `refreshProfile()`: Re-fetches the latest profile data from storage.

#### `src/context/ThemeContext.jsx`
* Creates `ThemeContext` and exposes `useTheme()` hook.
* **State**:
  * `theme`: `"light" | "dark" | "system"`.
  * `resolvedTheme`: `"light" | "dark"`.
  * `darkMode`: Boolean (`resolvedTheme === "dark"`).
* **Behavior**:
  * When `"system"` is active, dynamically tracks OS preference via `window.matchMedia("(prefers-color-scheme: dark)")`.
  * Sets attribute `data-theme="dark"` or `data-theme="light"` on `<html />`.
  * Persists setting in `localStorage.getItem("theme")`.
* **Methods**:
  * `setThemeMode(mode)`: Sets `"light"`, `"dark"`, or `"system"`.
  * `toggleTheme()`: Toggles between light and dark.

---

### 4.4 Custom Hooks (`src/hooks/`)

#### `src/hooks/useTodos.js`
* Primary business logic hook for task management.
* **Parameters**: `userId`.
* **Internal State**: `todos`, `loading`, `error`, `filter` (default `"all"`), `sort` (default `"createdAt_desc"`), `search` (default `""`).
* **Processing Pipeline**:
  1. Real-time subscription to `todoService.subscribeToTodos(userId)`.
  2. Runs `searchTasks(todos, search)` (matches title, description, category).
  3. Runs `filterTasks(searchResults, filter)` (filters for Today, Upcoming, Overdue, Completed, Pending, High Priority).
  4. Runs `sortTasks(filteredResults, sort)` (orders by creation date, due date, priority weight).
* **Computed Statistics**:
  * `stats.total`: Total number of tasks.
  * `stats.completed`: Number of completed tasks.
  * `stats.pending`: Number of pending tasks.
  * `stats.overdue`: Number of uncompleted tasks whose due date has passed.

#### `src/hooks/useOnlineStatus.js`
* Monitors `navigator.onLine` and window `online` / `offline` events.
* Returns boolean `isOnline`.

#### `src/hooks/useNotifications.js`
* Exposes notification permissions status, request method, and reminder scheduling functions.

---

### 4.5 Constants & Utilities

#### `src/constants/index.js`
* `CATEGORIES`:
  * `Study` (📚, `#6366f1`)
  * `Work` (💼, `#f59e0b`)
  * `Personal` (👤, `#10b981`)
  * `Shopping` (🛒, `#ec4899`)
  * `Other` (📌, `#8b5cf6`)
* `PRIORITIES`:
  * `High` (`#ef4444`, weight: 3)
  * `Medium` (`#f59e0b`, weight: 2)
  * `Low` (`#22c55e`, weight: 1)
* `FILTERS`: `all`, `today`, `upcoming`, `overdue`, `completed`, `pending`, `high`.
* `SORT_OPTIONS`: `createdAt_desc`, `createdAt_asc`, `dueDate_asc`, `dueDate_desc`, `priority_desc`, `priority_asc`.
* `APP_VERSION`: `"2.0.0"`.
* `APP_NAME`: `"TaskFlow"`.

#### `src/utils/helpers.js`
* **Date Helpers**:
  * `formatDate(dateString)`: Displays "Today", "Tomorrow", or localized date (e.g. "Aug 31").
  * `formatDateTime(dateString)`: Formats datetime for reminder display.
  * `isSameDay(d1, d2)`: Checks calendar day equality.
  * `isToday(dateString)`: Checks if date is today.
  * `isUpcoming(dateString)`: Checks if date is after today.
  * `isOverdue(task)`: Returns `true` if `!task.completed` and `task.dueDate` is before current date.
  * `getGreeting()`: Returns "Good Morning" (<12h), "Good Afternoon" (<17h), or "Good Evening".
  * `getTodayFormatted()`: Returns formatted string (e.g. "Monday, Aug 31").
  * `getWeekStart()`: Returns Monday timestamp of current week.
  * `getDayName(index)`: Returns "Sun", "Mon", "Tue", etc.
* **Validation & Data Helpers**:
  * `isValidEmail(email)`: Regex email format check.
  * `isValidPassword(password)`: Verifies length >= 6.
  * `getAuthErrorMessage(err)`: Returns friendly human-readable error messages.
  * `normalizeTask(task)`: Ensures default properties exist for older records.
  * `filterTasks(tasks, filter)`: Filters task array by criteria.
  * `sortTasks(tasks, sortBy)`: Sorts task array using date timestamps and priority weights.
  * `searchTasks(tasks, query)`: Multi-field case-insensitive search.

---

### 4.6 UI Components (`src/components/`)

1. **`BottomNav.jsx`**: Fixed mobile navigation bar with tabs for Home, Tasks, Stats, and Settings. Includes SVG icons and safe-area padding.
2. **`ProtectedRoute.jsx`**: Route guard checking auth state; renders `<Loading />` while loading or redirects unauthenticated users to `/login`.
3. **`Header.jsx`**: Standardized mobile page header with title and optional right-action badge/button slot.
4. **`SearchBar.jsx`**: Accessible search input with search icon and clear (`✕`) button.
5. **`FilterBar.jsx`**: Horizontally scrollable chip filter group and sorting dropdown menu.
6. **`TaskCard.jsx`**: Interactive task card containing circular completion toggle, title (with strikethrough when done), description, category colored badge, due date with overdue badge, priority color indicator dot, subtask checklist with progress bar and ratio (`☑️ 2/3`), expandable subtasks with one-tap toggle, and delete button.
7. **`TaskForm.jsx`**: Modal bottom sheet for creating or editing tasks. Validates title, category, priority, due date, reminder, and interactive subtask checklist with item creation and removal.
8. **`TaskList.jsx`**: Maps tasks to `TaskCard` elements or renders an `EmptyState` when empty, propagating toggle events.
9. **`Scratchpad.jsx`**: Frictionless quick checklist scratchpad on the dashboard for instant notes, subtasks, instant toggle, bulk completion, and 1-click conversion to formal tasks.
10. **`StatCard.jsx`**: Dashboard metric card with icon, numeric value, label, and left accent border.
11. **`ConfirmDialog.jsx`**: Modal dialog for confirming destructive actions (e.g. deleting a task or deleting an account).
12. **`EmptyState.jsx`**: Clean placeholder graphic with emoji icon, title, and subtitle.
13. **`Loading.jsx`**: Accessible animated spinner with message.

---

### 4.7 Application Pages (`src/pages/`)

1. **`Home.jsx` (Dashboard)**:
   * Displays time-based greeting, user's display name, and today's date.
   * Displays 4 statistics cards (Total, Done, Pending, Overdue).
   * Displays **Today's Tasks** section and **Upcoming Tasks** section.
   * Floating Action Button (**FAB**) to trigger the new task creation bottom sheet.
   * Offline banner indicator if internet is disconnected.
2. **`Tasks.jsx` (Task Manager)**:
   * Full task management interface.
   * Header with task count badge.
   * Real-time search bar.
   * Scrollable filter chips (All, Today, Upcoming, Overdue, Completed, Pending, High Priority).
   * Sorting dropdown.
   * Task list with tap-to-edit and delete confirmation.
   * Floating Action Button (FAB).
3. **`Statistics.jsx` (Productivity Analytics)**:
   * Summary metric cards.
   * Overall **Completion Rate** with animated progress bar.
   * **7-Day Weekly Bar Chart**: Pure CSS flexbox chart calculating completed tasks per day for the last 7 days.
   * **Category Breakdown**: Percentage bars displaying task volume per category with category colors.
4. **`Settings.jsx` (Profile & Preferences)**:
   * Profile card: email display, editable display name with save feedback.
   * Appearance card: Light, Dark, and System theme selectors.
   * Notifications card: toggle and permission status for reminders.
   * Account card: Password change, Logout, and Delete Account with confirmation modal.
   * About card: Version (`2.0.0`) and stack info.
5. **`Login.jsx`**:
   * Email and password sign-in form.
   * Client-side validation and error alerts.
   * Links to Signup and Forgot Password.
6. **`Signup.jsx`**:
   * Registration form with email, password (min 6 chars), and confirm password.
   * Instant local account creation.
7. **`ForgotPassword.jsx`**:
   * Password reset request form.

---

### 4.8 CSS Design System (`src/styles/`)

* **`index.css`**: Core design tokens (`:root` and `[data-theme="dark"]`), resets, base layout (`.app-container`, `.app-content`, `.page`), button styles (`.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-icon`), form inputs, Floating Action Button (`.fab`), modal overlays, spinners, animations (`fadeIn`, `slideUp`, `spin`), and desktop responsive media queries.
* **`auth.css`**: Centered card layout with gradient headers for authentication screens.
* **`home.css`**: 2x2 grid layout for stat cards, greeting typography, and section headers.
* **`tasks.css`**: Search input, horizontal scroll chips, task cards, circular checkbox animations, priority dots, and modal bottom sheet.
* **`statistics.css`**: Progress bar styling, flexbox weekly bar chart, and category distribution rows.
* **`settings.css`**: Grouped settings cards, theme selector buttons, and setting rows.
* **`components.css`**: Bottom navigation bar styling with safe-area bottom insets and header layout.

---

## 5. Data Storage Schemas

All data is stored in the client-side `localStorage` sandbox with multi-user isolation:

### User Object (`todo_app_users`)
```json
[
  {
    "uid": "usr_1740812345678_abc123",
    "email": "omprakash@gmail.com",
    "password": "user_password",
    "displayName": "omprakash",
    "createdAt": "2026-08-31T10:00:00.000Z"
  }
]
```

### Active Session (`todo_app_session`)
```json
{
  "uid": "usr_1740812345678_abc123",
  "email": "omprakash@gmail.com",
  "displayName": "omprakash"
}
```

### Task Object (`todo_app_todos`)
```json
[
  {
    "id": "task_1740812399999_xyz789",
    "userId": "usr_1740812345678_abc123",
    "title": "Complete Assignment",
    "description": "Review chapters 1 to 5",
    "category": "Study",
    "priority": "High",
    "dueDate": "2026-08-31",
    "reminderTime": "2026-08-31T19:00",
    "completed": false,
    "createdAt": "2026-08-31T09:30:00.000Z",
    "updatedAt": "2026-08-31T09:30:00.000Z"
  }
]
```

---

## 6. Android Platform & Native Configuration

The Android project is managed in `/android`.

1. **Hardware Back Button Navigation** (`src/App.jsx`):
   * Subscribes to `@capacitor/app` `backButton` event.
   * If there is browser navigation history, calls `window.history.back()`.
   * If the user is on the root screen, calls `CapApp.exitApp()`.
2. **Android Permissions** (`android/app/src/main/AndroidManifest.xml`):
   * `INTERNET`: Network access.
   * `ACCESS_NETWORK_STATE`: Connectivity state monitoring.
   * `POST_NOTIFICATIONS`: Android 13+ local reminder notifications.
   * `VIBRATE`: Notification alert vibration.
   * `RECEIVE_BOOT_COMPLETED`: Restores scheduled reminder alarms after phone reboot.
   * `WAKE_LOCK`: Ensures device triggers alarm at scheduled reminder time.
3. **App Branding**:
   * App name configured as **TaskFlow** in `android/app/src/main/res/values/strings.xml`.
   * Status bar themed with `#6366f1`.

---

## 7. Developer Commands & Build Playbook

### Running on the Web
```bash
# Install packages
npm install

# Start development server
npm run dev

# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

### Building & Synchronizing for Android
```bash
# Build React application and sync assets to Android in one command
npm run cap:build

# Open project in Android Studio
npm run cap:open
```

### Generating APK & AAB Files
1. **Debug APK**:
   * Open Android Studio (`npm run cap:open`).
   * Click **Build** $\to$ **Build Bundle(s) / APK(s)** $\to$ **Build APK(s)**.
   * Output file: `android/app/build/outputs/apk/debug/app-debug.apk`.
   * Command-line alternative:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```
2. **Release AAB (Google Play Store)**:
   * In Android Studio, click **Build** $\to$ **Generate Signed Bundle / APK...**
   * Select **Android App Bundle** $\to$ choose Keystore $\to$ select **release** variant.
   * Output file: `android/app/build/outputs/bundle/release/app-release.aab`.
   * Command-line alternative:
     ```bash
     cd android
     ./gradlew bundleRelease
     ```

---

## 8. Summary of Key Features & Technical Highlights

* **100% Standalone & Local-First**: No external API keys or cloud server dependencies; works immediately out of the box.
* **Super Lightweight**: Complete production bundle is only **223 kB** (70 kB gzipped) and compiles in **1.4s**.
* **Zero Jitter Real-Time Sync**: Custom event emitter synchronizes data across components and browser tabs instantly.
* **Full Multi-User Isolation**: Supports multiple accounts on the same device with private, isolated task lists.
* **Complete Task Organization**: Categories, priorities, due dates, overdue detection, real-time search, 7 filters, and 6 sorting options.
* **Mobile-First UX**: Responsive touch targets (min 44px), bottom navigation, smooth bottom sheets, and dark mode.
