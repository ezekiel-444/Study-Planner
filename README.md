# Study Planner

A personal study task manager built for a Design Patterns course. Organize tasks by subject, track deadlines, filter by status, persist data locally, and view statistics — all in a polished single-page app with no build step.

## How to Run (read this first)

All updated files live inside the **`Study-Planner`** folder. If you open the wrong file, you will see the old layout or broken scripts.
run manually:

```bash
cd Study-Planner
npx serve . -p 3000
```

### Open the HTML file directly

Open index html file in your browser.

> **Tip:** After changes, hard-refresh the page: **Ctrl + Shift + R** (clears cached CSS/JS).

### Where the new files are

| What            | Path                       |
| --------------- | -------------------------- |
| App (open this) | `Study-Planner/index.html` |
| This guide      | `Study-Planner/README.md`  |

No npm install, bundler, or backend required.

---

## Requirements Coverage

| Requirement               | Implementation                                                                |
| ------------------------- | ----------------------------------------------------------------------------- |
| **Create tasks**          | Form → `TaskStore.add()` → `TaskFactory.create()`                             |
| **View tasks**            | Grouped by subject via Composite pattern; sorted (overdue first)              |
| **Edit tasks**            | Edit button fills form; `TaskStore.update()` preserves done/pending status    |
| **Delete tasks**          | Delete with confirmation; undo via Memento                                    |
| **Validate empty inputs** | `TaskFactory.validate()` — subject, title, and deadline required              |
| **Mark done / not done**  | Checkbox toggle → `TaskStore.toggle()`                                        |
| **Filter by subject**     | Subject dropdown; combines with status filter                                 |
| **Filter by status**      | All, Pending, Completed, Overdue, Due Today, Due This Week                    |
| **Save data**             | `localStorage` (auto-save) + JSON export/import backup files                  |
| **Statistics**            | Total, Completed, Pending, Overdue, Due Today, Due This Week, Completion Rate |
| **Per-subject stats**     | Table built from Composite tree                                               |

---

## Demo Workflow

Follow this sequence to demonstrate the full app:

### 1. Add tasks

1. Fill in **Subject** (e.g. `Mathematics`), **Task Title** (e.g. `Chapter 5 exercises`), and **Deadline**.
2. Optionally add **Notes**.
3. Click **Add Task** — a toast confirms success; the task appears under its subject group.

Try adding tasks in different subjects and with different deadlines (including past dates to demo overdue).

### 2. View and organize

- Tasks are **grouped by subject** with a count badge.
- **Overdue** tasks appear first, highlighted in red with an "X days overdue" label.
- **Due today** tasks get a yellow border and badge.

### 3. Mark complete

- Click the circle checkbox on any task to toggle **done / pending**.
- Completed tasks show a strikethrough and green "Done" badge; they no longer count as overdue.

### 4. Edit a task

1. Click the pencil icon on a task.
2. The form switches to **Edit Task** mode with fields pre-filled.
3. Change fields and click **Save Changes**, or **Cancel** to abort.
4. Editing does **not** reset a completed task back to pending.

### 5. Delete and undo

1. Click the trash icon → confirm deletion.
2. Click **Undo** in the header to restore the last deleted task (Memento pattern).

### 6. Filter

- Use **Filter by status** and **Filter by subject** together — both apply at once.
- The summary line shows the active combination (e.g. `Showing: Overdue · Mathematics`).
- If filters hide everything, an empty state explains that no tasks match.

### 7. Statistics

- The top **stats bar** shows global counts (always reflects **all** tasks, not filters).
- The **Statistics by Subject** table breaks down totals per subject.

### 8. Persistence and backup

- Data **auto-saves** to `localStorage` on every change — refresh the page to verify.
- **Export** downloads a versioned JSON backup file.
- **Import** replaces all tasks (with confirmation) from a backup file.

### 9. Theme

- Click the moon/sun button to toggle **light / dark** theme (also saved in `localStorage`).

---

## Code Structure

```
Study-Planner/
├── index.html                 # HTML shell — layout, stats, form, filters, task list
├── css/styles.css             # Theming, glass cards, responsive layout
├── README.md                  # This file — setup, demo, quick reference
├── REPORT.md                  # Full technical report with design patterns
└── js/
    ├── app.js                 # Entry point — theme restore + UIRenderer boot
    ├── models/
    │   └── Task.js            # Task entity + TaskFactory (Factory)
    ├── store/
    │   └── TaskStore.js       # Singleton store, Observer, CRUD API
    ├── persistence/
    │   ├── ITaskRepository.js # Repository contract (DIP)
    │   ├── LocalStorageRepository.js
    │   └── TaskMemento.js     # Snapshot for undo (Memento)
    ├── strategies/
    │   ├── FilterStrategy.js  # Status/subject filters (Strategy)
    │   ├── DeadlineStrategy.js
    │   └── StatsStrategy.js
    ├── components/
    │   └── TaskComposite.js   # Subject groups (Composite)
    ├── ui/
    │   └── UIRenderer.js      # DOM rendering + user events
    └── utils/
        ├── dateUtils.js       # Calendar-day deadline helpers
        └── domUtils.js        # escapeHtml for safe rendering
```

### Data flow

```
User action (click / submit)
    → UIRenderer event handler
    → TaskStore method (add / update / remove / toggle)
    → TaskFactory validates (on create/update)
    → LocalStorageRepository persists
    → TaskStore._notify()  (Observer)
    → UIRenderer.render()  (stats, filters, task list)
```

### Layer responsibilities

| Layer              | Files                                         | Role                                         |
| ------------------ | --------------------------------------------- | -------------------------------------------- |
| **Presentation**   | `index.html`, `styles.css`, `UIRenderer.js`   | UI, events, rendering                        |
| **Application**    | `TaskStore.js`                                | State, CRUD, coordinates persistence & stats |
| **Domain**         | `Task.js`, `TaskComposite.js`                 | Task rules, grouping, overdue logic          |
| **Infrastructure** | `LocalStorageRepository.js`, `TaskMemento.js` | Storage, backup, undo snapshots              |
| **Strategies**     | `*Strategy.js`                                | Pluggable filters, deadlines, statistics     |

---

## Design Patterns (Summary)

| Pattern        | Location                                              | Purpose                                      |
| -------------- | ----------------------------------------------------- | -------------------------------------------- |
| **Factory**    | `Task.js`                                             | Centralized creation, validation, restore    |
| **Singleton**  | `TaskStore.js`                                        | One shared store for the app                 |
| **Observer**   | `TaskStore.subscribe()`                               | UI auto-updates on data changes              |
| **Strategy**   | `FilterStrategy`, `DeadlineStrategy`, `StatsStrategy` | Swappable rules for filters and stats        |
| **Composite**  | `TaskComposite.js`                                    | Uniform subject groups for display and stats |
| **Repository** | `ITaskRepository`, `LocalStorageRepository`           | Abstract persistence from business logic     |
| **Memento**    | `TaskMemento.js`                                      | Capture/restore state for undo after delete  |

---

## Features

- Full CRUD with input validation
- Toggle done / pending
- Combined status + subject filters
- Overdue detection, sorting, and badges
- Statistics dashboard + per-subject breakdown
- Export / import JSON backups (versioned schema)
- Undo last delete
- Light / dark theme
- Toast notifications for actions outside the form
- XSS-safe rendering via `escapeHtml`
