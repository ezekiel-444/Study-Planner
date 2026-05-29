/**
 * FilterStrategies contains different ways to filter tasks.
 * Each filter is separated, which makes the code easier
 * to manage and extend later.
 */

// Different filtering options
export const FilterStrategies = {

  // Show all tasks
  all: {
    apply: (tasks) => tasks
  },

  // Show only pending tasks
  pending: {
    apply: (tasks) =>
      tasks.filter(t => t.status === 'pending')
  },

  // Show completed tasks
  done: {
    apply: (tasks) =>
      tasks.filter(t => t.status === 'done')
  },

  // Show overdue tasks
  overdue: {
    apply: (tasks) =>
      tasks.filter(t => t.isOverdue())
  },

  // Filter tasks by subject
  bySubject: (subject) => ({
    apply: (tasks) =>
      tasks.filter(t => t.subject === subject)
  })
};

/**
 * FilterContext stores the currently selected filter
 * and applies it to the task list.
 */
export class FilterContext {

  // Default filter is "all"
  constructor(strategy = FilterStrategies.all) {
    this._strategy = strategy;
  }

  // Change current filter
  setStrategy(strategy) {
    this._strategy = strategy;
  }

  // Apply selected filter to tasks
  apply(tasks) {
    return this._strategy.apply(tasks);
  }
}




