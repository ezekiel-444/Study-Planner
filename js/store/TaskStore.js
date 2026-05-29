/**

* TaskStore
*
* Singleton Pattern:
* Only one shared store exists in the entire application.
* This prevents inconsistent task data.
*
* Observer Pattern:
* Components subscribe to updates instead of constantly checking for changes.
*
* Open/Closed Principle:
* New subscribers or features can be added
* without modifying existing store logic.
  */

import { TaskFactory } from '../models/Task.js';

// Key used to save tasks inside localStorage
const STORAGE_KEY = 'planner_tasks';

class TaskStore {

constructor() {

```
// Singleton Pattern:
// Return existing instance if already created
if (TaskStore._instance) return TaskStore._instance;

// Save current instance
TaskStore._instance = this;

// Stores all tasks
this._tasks = [];

// Stores subscribed listener functions
this._listeners = [];

// Load saved tasks when application starts
this._load();
```

}

/**

* Observer Pattern
*
* Allows components to subscribe to store updates.
* Returns an unsubscribe function.
  */
  subscribe(listener) {

```
// Add listener to subscribers list
```

```
this._listeners.push(listener);

// Remove listener later if needed
return () => {
  this._listeners =
    this._listeners.filter(l => l !== listener);
};
```

}

/**

* Notify all subscribers about state changes
  */
  _notify() {
  this._listeners.forEach(fn => fn(this._tasks));
  }

/**

* DRY Principle:
* One reusable save method used after every data change
  */
  _save() {

```
// Convert tasks into JSON and save to browser storage
```

```
localStorage.setItem(
  STORAGE_KEY,
  JSON.stringify(this._tasks)
);
```

}

/**

* Load saved tasks from localStorage
  */
  _load() {

```
try {
```

```
  // Read saved data
  const raw = localStorage.getItem(STORAGE_KEY);

  // Convert JSON back into JavaScript objects
  const data = raw ? JSON.parse(raw) : [];

  // Restore task objects using TaskFactory
  this._tasks = data.map(t =>
    TaskFactory.restore(t)
  );

} catch {

  // Prevent application crash if data is invalid
  this._tasks = [];
}
```

}

/**

* Returns a copy of all tasks
* Spread operator protects internal array
  */
  getAll() {
  return [...this._tasks];
  }

/**

* Create and add a new task
  */
  add(taskData) {

```
// Create task object using factory
```

```
const task = TaskFactory.create(taskData);

// Store task
this._tasks.push(task);

// Save and notify subscribers
this._save();
this._notify();

return task;
```

}

/**

* Update an existing task
  */
  update(id, changes) {

```
// Find task index by ID
```

```
const idx =
  this._tasks.findIndex(t => t.id === id);

// Stop if task does not exist
if (idx === -1) return;

// Apply changes to task object
Object.assign(this._tasks[idx], changes);

// Save and notify subscribers
this._save();
this._notify();
```

}

/**

* Remove task by ID
  */
  remove(id) {

```
// Keep all tasks except matching ID
```

```
this._tasks =
  this._tasks.filter(t => t.id !== id);

// Save and notify subscribers
this._save();
this._notify();
```

}

/**

* Toggle task status
* Changes between "done" and "pending"
  */
  toggle(id) {

```
// Find task by ID
```

```
const task =
  this._tasks.find(t => t.id === id);

if (!task) return;

// Change task status
task.status =
  task.status === 'done'
    ? 'pending'
    : 'done';

// Save and notify subscribers
this._save();
this._notify();
```

}

/**

* Calculate planner statistics
  */
  getStats() {

```
// Total number of tasks
```

```
const total = this._tasks.length;

// Count completed tasks
const completed =
  this._tasks.filter(t => t.isDone()).length;

// Count overdue tasks
const overdue =
  this._tasks.filter(t => t.isOverdue()).length;

return {
  total,
  completed,
  overdue
};
```

}

/**

* Returns unique subjects from tasks
  */
  getSubjects() {

```
return [
```

```
  ...new Set(
    this._tasks
      .map(t => t.subject)
      .filter(Boolean)
  )
];
```

}
}

// Export single shared store instance
export const taskStore = new TaskStore();
