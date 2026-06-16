# Study Planner — Technical Report

**Project:** Study Planner (Design Patterns Course)  
**Stack:** Vanilla HTML, CSS, JavaScript (ES Modules)  
**Persistence:** Browser `localStorage` + JSON file export/import  

This document explains the project architecture, workflow, requirements mapping, and the design patterns used — what each pattern does, where it lives in the code, and why it was chosen.

---

## 1. Project Overview

Study Planner is a single-page application for managing study tasks. Users can create tasks with a subject, title, deadline, and optional notes; mark them complete; filter the list; and view statistics. All data persists between sessions.

The codebase is organized in **layers** so that UI, business logic, and storage stay separate. Design patterns are applied deliberately — not for complexity, but to keep each concern in one place and make the code easier to extend (e.g. adding a new filter or swapping storage).

---

## 2. Requirements Mapping

### Initial requirements

| Requirement | How it is implemented |
|---|---|
| Create tasks | Form submit → `TaskStore.add()` → `TaskFactory.create()` assigns UUID and validates |
| View tasks | `UIRenderer._renderList()` builds subject groups via `buildSubjectTree()` |
| Edit tasks | Edit button → form pre-fill → `TaskStore.update()` (status preserved) |
| Delete tasks | Delete button → confirm → `TaskStore.remove()` |
| Validate empty inputs | `TaskFactory.validate()` rejects missing subject, title, or deadline |
| Mark done / not done | Checkbox → `TaskStore.toggle()` flips `pending` ↔ `done` |
| Filter by subject | Subject `<select>` + `applyCombinedFilters()` |
| Filter by status | Status `<select>` + `FilterStrategies` |
| Save in localStorage / JSON | `LocalStorageRepository` auto-save; export/import JSON files |
| Statistics | `StatsStrategies.overview` — total, completed, overdue (+ pending, due today, rate) |

### Final requirements

| Requirement | How it is implemented |
|---|---|
| Polish UI | Glass-card layout, scenic background, dark mode, toasts, responsive stats grid |
| README | Setup, demo workflow, structure overview |
| Demo workflow | Step-by-step guide in README |
| Explain code structure | This report + README structure section |

---

## 3. Application Workflow

### Startup

```
index.html loads
    → app.js runs
    → restores theme from localStorage
    → new UIRenderer()
        → TaskStore singleton loads tasks from localStorage
        → UIRenderer subscribes to store (Observer)
        → initial render()
```

### Create task

```
User submits form
    → UIRenderer._handleSubmit()
    → TaskStore.add(data)
        → TaskFactory.create() validates + creates Task with new id
        → LocalStorageRepository.save()
        → _notify() subscribers
    → UIRenderer.render() updates stats, filters, list
    → Toast: "Task added successfully"
```

### Edit task

```
User clicks Edit
    → _startEdit(id) fills form, sets editingId
User submits
    → TaskStore.update(id, { subject, title, deadline, notes })
        → merges with existing task, validates, does NOT change status/id
    → _cancelEdit() resets form
```

### Delete + undo

```
User confirms delete
    → TaskMemento.capture(current tasks)   // snapshot BEFORE delete
    → remove task from array, persist, notify
User clicks Undo
    → TaskMemento.restore() replaces in-memory list
```

### Filter

```
User changes status or subject dropdown
    → applyCombinedFilters(allTasks, statusKey, subject)
        → first applies status strategy (e.g. overdue)
        → then subject strategy if selected
    → sortTasksForDisplay() — overdue first, then pending, then by date
    → buildSubjectTree() groups for display
```

### Export / import

```
Export: TaskStore.exportBackup() → JSON blob download
Import: confirm dialog → parse JSON → validate each task → replace store
```

---

## 4. Code Structure

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION                                               │
│  index.html · styles.css · UIRenderer.js                    │
│  (DOM, events, rendering — no business rules)               │
└──────────────────────────┬──────────────────────────────────┘
                           │ calls
┌──────────────────────────▼──────────────────────────────────┐
│  APPLICATION                                                │
│  TaskStore.js (Singleton + Observer + Facade-like API)      │
└──────┬─────────────────┬─────────────────┬──────────────────┘
       │                 │                 │
┌──────▼──────┐   ┌──────▼──────┐   ┌──────▼──────────────────┐
│  DOMAIN     │   │  STRATEGIES │   │  INFRASTRUCTURE           │
│  Task.js    │   │  Filter     │   │  LocalStorageRepository   │
│  TaskComposite│ │  Deadline   │   │  TaskMemento              │
│             │   │  Stats      │   │  ITaskRepository (DIP)    │
└─────────────┘   └─────────────┘   └───────────────────────────┘
```

### File-by-file responsibilities

| File | Responsibility |
|---|---|
| `app.js` | Bootstrap: theme, instantiate `UIRenderer` |
| `Task.js` | Task entity; overdue/done helpers; `TaskFactory` for create/validate/restore |
| `TaskStore.js` | Single source of truth; CRUD; persistence; stats delegation; observer pub/sub |
| `ITaskRepository.js` | Abstract contract for load/save/export/import |
| `LocalStorageRepository.js` | Versioned JSON in `localStorage`; legacy array support |
| `TaskMemento.js` | Deep copy snapshot of tasks for undo |
| `FilterStrategy.js` | Status and subject filter algorithms + `applyCombinedFilters()` |
| `DeadlineStrategy.js` | Reusable overdue / due-today / due-week matching rules |
| `StatsStrategy.js` | Overview and per-subject statistics computation |
| `TaskComposite.js` | `TaskGroup` / `TaskLeaf` tree; subject grouping; display sort |
| `UIRenderer.js` | All DOM updates and user interaction |
| `dateUtils.js` | Calendar-day comparisons (timezone-safe for `<input type="date">`) |
| `domUtils.js` | `escapeHtml()` — prevents XSS when rendering user text |

---

## 5. Design Patterns

Each pattern solves a specific problem. Together they keep the app modular without unnecessary abstraction.

---

### 5.1 Factory Pattern

**Location:** `js/models/Task.js` — `TaskFactory`

**What it does:** Centralizes how `Task` objects are created, validated, and restored from saved JSON.

```javascript
TaskFactory.create(data)   // validate → throw or return new Task with UUID
TaskFactory.validate(data) // returns array of error messages
TaskFactory.restore(data)  // rebuild Task from storage (keeps existing id)
```

**Why we chose it:**

- Task creation rules (required fields, ID assignment) live in **one place** instead of being duplicated in the form handler and import logic.
- Invalid tasks never enter the store — the factory is the gatekeeper.
- Import and undo both use `restore()`, so loaded data follows the same path as new tasks.

**Without it:** Validation and ID logic would scatter across `UIRenderer`, `TaskStore`, and `LocalStorageRepository`, making bugs likely (e.g. the edit-form accidentally resetting status).

---

### 5.2 Singleton Pattern

**Location:** `js/store/TaskStore.js`

**What it does:** Ensures exactly one `TaskStore` instance exists for the entire application.

```javascript
class TaskStore {
  constructor(repository = new LocalStorageRepository()) {
    if (TaskStore._instance) return TaskStore._instance;
    TaskStore._instance = this;
    // ...
  }
}
export const taskStore = new TaskStore();
```

**Why we chose it:**

- All UI components and future modules must share the **same task list** and the same persisted state.
- Prevents accidental second stores with out-of-sync data.

**Without it:** Multiple store instances could load/save different copies of tasks.

---

### 5.3 Observer Pattern

**Location:** `js/store/TaskStore.js` + `js/ui/UIRenderer.js`

**What it does:** The store notifies subscribers whenever data changes; the UI re-renders automatically.

```javascript
// TaskStore
subscribe(listener) { this._listeners.push(listener); }
_notify() { this._listeners.forEach(fn => fn()); }

// UIRenderer constructor
taskStore.subscribe(() => this.render());
```

**Why we chose it:**

- **Decouples** data from presentation: `TaskStore` never touches the DOM.
- Any change (add, edit, delete, toggle, import, undo) triggers one consistent update path.
- Easy to add another subscriber later (e.g. a console logger or analytics) without changing store methods.

**Without it:** Every CRUD method would need manual `render()` calls from the UI layer, and missed calls would cause stale screens.

---

### 5.4 Strategy Pattern

**Location:** `js/strategies/FilterStrategy.js`, `DeadlineStrategy.js`, `StatsStrategy.js`

**What it does:** Encapsulates interchangeable algorithms behind a common interface. The **Context** class (`FilterContext`, `StatsContext`, `DeadlineContext`) delegates to the active strategy.

**Filter example:**

```javascript
FilterStrategies.pending.apply(tasks)   // only pending
FilterStrategies.overdue.apply(tasks)   // uses DeadlineStrategies.overdue
FilterStrategies.bySubject('Math').apply(tasks)
```

**Stats example:**

```javascript
StatsStrategies.overview.compute(tasks)    // global counts
StatsStrategies.bySubject.compute(tasks)   // per-subject rows
```

**Why we chose it:**

- Each filter rule is a **small, named object** — easy to read and test.
- New filters (e.g. "high priority") = new strategy object, no changes to `UIRenderer` logic.
- `DeadlineStrategies` are shared by both filters and `Task.isOverdue()`-style checks — **DRY** deadline rules.
- Stats overview vs. by-subject use the same Context interface but different algorithms.

**Without it:** One giant `switch` in the UI for every filter and stat type — hard to extend and reason about.

---

### 5.5 Composite Pattern

**Location:** `js/components/TaskComposite.js`

**What it does:** Treats individual tasks (`TaskLeaf`) and groups of tasks (`TaskGroup`) uniformly through the same interface.

```javascript
group.getCount()
group.getCompletedCount()
group.getOverdueCount()
group.getCompletionRate()
group.getItems()  // flat list of tasks in group
```

**Why we chose it:**

- Tasks are displayed **grouped by subject** — a group behaves like a container with aggregate stats.
- `StatsStrategies.bySubject` reuses the same tree: one algorithm computes stats for leaves and groups recursively.
- Adding a nested structure later (e.g. subtopics) would extend `TaskGroup` without rewriting stats.

**Without it:** Subject grouping and per-subject stats would duplicate loops and counting logic in the UI and stats module.

---

### 5.6 Repository Pattern

**Location:** `js/persistence/ITaskRepository.js`, `LocalStorageRepository.js`

**What it does:** Abstracts **how** tasks are stored from **what** the application does with them.

```javascript
// Contract
load() · save(tasks) · exportJson(tasks) · importJson(json)

// Implementation
localStorage.setItem('planner_tasks', JSON.stringify({ version: 1, tasks }))
```

**Why we chose it:**

- `TaskStore` depends on `ITaskRepository`, not `localStorage` directly — **Dependency Inversion (SOLID)**.
- Swapping to IndexedDB, a REST API, or a JSON file on disk means a new repository class, not a rewrite of `TaskStore`.
- Schema versioning (`version: 1`) and legacy plain-array format are isolated in one file.

**Without it:** Storage details leak into the store; testing would require mocking `localStorage` inside business logic.

---

### 5.7 Memento Pattern

**Location:** `js/persistence/TaskMemento.js`

**What it does:** Captures a snapshot of task state that can be restored later without exposing internal store structure.

```javascript
const memento = TaskMemento.capture(tasks);  // array of plain JSON objects
const restored = memento.restore();            // array of Task instances
```

**Why we chose it:**

- **Undo delete** needs a copy of the list *before* the deletion — Memento formalizes capture/restore.
- The snapshot is immutable data (JSON copies), so restore always gets a consistent point-in-time state.
- Could extend to full "restore backup point" without changing the undo API.

**Without it:** Undo would manually splice arrays or keep deleted task references ad hoc.

---

### 5.8 Additional principles (not full Gang-of-Four patterns)

| Principle | Where | Purpose |
|---|---|---|
| **Single Responsibility** | Each file has one job (Task = data, UIRenderer = DOM, etc.) | Easier navigation and testing |
| **Dependency Inversion** | `TaskStore` → `ITaskRepository` | Store unaware of localStorage |
| **Module pattern** | ES `import`/`export` per folder | Clear boundaries between layers |
| **Facade-like API** | `TaskStore` public methods | UI calls simple `add/update/remove` instead of touching repository + memento + stats |

---

## 6. Important Implementation Details

### 6.1 Date handling

`<input type="date">` values are `YYYY-MM-DD` strings. `dateUtils.js` parses them as local midnight and compares **calendar days**, avoiding timezone shifts that would mark tasks overdue incorrectly.

### 6.2 Overdue logic

A task is overdue when:

- `status !== 'done'`, and  
- deadline is before today (calendar day)

Completed tasks never count as overdue in filters or statistics.

### 6.3 Combined filters

Status and subject filters **stack**: e.g. "Overdue" + "Mathematics" shows only overdue math tasks. Implemented in `applyCombinedFilters()` by chaining two strategies.

### 6.4 Edit preserves status

Updates send only `{ subject, title, deadline, notes }`. `TaskStore.update()` ignores `status` in changes so editing never resets a completed task.

### 6.5 Security

User-provided text (title, notes, subject) is passed through `escapeHtml()` before insertion into `innerHTML`, preventing XSS from malicious input.

### 6.6 Persistence format

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "uuid",
      "subject": "Mathematics",
      "title": "Chapter 5",
      "deadline": "2026-06-20",
      "status": "pending",
      "notes": "",
      "createdAt": "2026-06-16T12:00:00.000Z"
    }
  ]
}
```

Export uses the same schema. Import validates every task before replacing the store.

---

## 7. UI Architecture

| Area | Behavior |
|---|---|
| **Stats bar** | Always shows global totals (unfiltered) |
| **Subject stats table** | Built from Composite tree over all tasks |
| **Task form** | Add mode by default; edit mode swaps title/buttons |
| **Filters** | Status + subject; summary text shows active combination |
| **Task list** | Event delegation on `#task-list` — one listener, works after re-render |
| **Toast** | Non-form feedback (export, import, undo, delete) |
| **Theme** | CSS custom properties; `body.dark` class; saved in `localStorage` |

---

## 8. Extensibility Examples

Thanks to the patterns, common extensions are straightforward:

| Feature | Approach |
|---|---|
| New filter ("Due tomorrow") | Add `FilterStrategies.dueTomorrow` + option in HTML |
| Server sync | Implement `ApiTaskRepository extends ITaskRepository` |
| Multi-step undo | Stack of `TaskMemento` instances instead of single `_lastMemento` |
| Priority field | Extend `Task` + `TaskFactory.validate`; filters use new Strategy |
| Filtered stats | Pass filtered array to `StatsContext.compute()` from UI |

---

## 9. Summary

Study Planner fulfills all initial and final requirements through a **layered architecture** and **seven classic design patterns**, each chosen for a concrete reason:

- **Factory** — safe, validated task creation  
- **Singleton** — one shared store  
- **Observer** — automatic UI sync  
- **Strategy** — flexible filters and statistics  
- **Composite** — subject groups with uniform stats  
- **Repository** — swappable persistence  
- **Memento** — reliable undo  

The result is a small but well-structured codebase: easy to demo, document, and extend — without framework overhead or over-engineering.

---

## 10. Quick Reference — Pattern → File → Key Symbol

| Pattern | File | Key symbol |
|---|---|---|
| Factory | `models/Task.js` | `TaskFactory` |
| Singleton | `store/TaskStore.js` | `taskStore` |
| Observer | `store/TaskStore.js` | `subscribe()`, `_notify()` |
| Strategy | `strategies/*.js` | `FilterStrategies`, `StatsStrategies`, `DeadlineStrategies` |
| Composite | `components/TaskComposite.js` | `TaskGroup`, `TaskLeaf`, `buildSubjectTree()` |
| Repository | `persistence/*.js` | `ITaskRepository`, `LocalStorageRepository` |
| Memento | `persistence/TaskMemento.js` | `TaskMemento.capture()`, `.restore()` |
