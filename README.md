# Study Planner

A personal study task planner built for a Design Patterns course. Tasks are grouped by subject, filtered by status/deadline, persisted across sessions, and summarized with statistics.

## How to Run

Open `index.html` in a modern browser, or serve the folder with any static server:

```bash
npx serve .
```

No build step or dependencies required.

## Midterm 2 Requirements

| Requirement | Implementation |
|---|---|
| **Persistence** | `LocalStorageRepository` saves versioned JSON; export/import backup files |
| **Overdue detection** | `Task.isOverdue()` with calendar-day comparison; overdue filter, badges, and sorting |
| **Statistics** | Overview stats (total, done, pending, overdue, due this week, completion %) and per-subject table via Composite |

## Design Patterns

| Pattern | Where | Purpose |
|---|---|---|
| **Factory** | `js/models/Task.js` | Centralized task creation, validation, and restore |
| **Singleton** | `js/store/TaskStore.js` | One shared store for the whole app |
| **Observer** | `TaskStore.subscribe()` → `UIRenderer` | UI auto-updates when data changes |
| **Strategy** | `FilterStrategy`, `DeadlineStrategy`, `StatsStrategy` | Swappable filter, deadline, and stats rules |
| **Composite** | `TaskComposite.js` | Group tasks by subject; compute stats on groups uniformly |
| **Repository** | `ITaskRepository`, `LocalStorageRepository` | Abstract persistence away from business logic |
| **Memento** | `TaskMemento.js` | Capture/restore state for undo after delete |

## Project Structure

```
index.html              # HTML shell (no inline code)
css/styles.css          # All styles
js/
  app.js                # Entry point
  models/Task.js        # Task model + Factory
  store/TaskStore.js    # Singleton store + Observer
  persistence/          # Repository + Memento
  strategies/           # Filter, Deadline, Stats strategies
  components/           # Composite tree + sorting
  ui/UIRenderer.js      # DOM rendering
  utils/dateUtils.js    # Shared date helpers
```

## Features

- Add, edit, delete, and mark tasks complete
- Filter by status (pending, done, overdue, due today, due this week) or subject
- Overdue tasks sorted to the top with "X days overdue" labels
- Statistics dashboard and per-subject breakdown table
- Export / import JSON backups
- Undo last delete (Memento)
- Light / dark theme (also persisted in localStorage)
