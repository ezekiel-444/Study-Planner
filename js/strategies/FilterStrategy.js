/**
 * Filter Strategies
 * Strategy Pattern: swap filtering algorithms at runtime without changing callers.
 * Open/Closed (SOLID): add new filter strategies without modifying existing code.
 * DRY: filtering logic lives in one place.
 */

// Each strategy is a plain object with a single `apply` method.
// This is the lightweight JS equivalent of a Strategy interface.

export const FilterStrategies = {
  all: {
    apply: (tasks) => tasks
  },

  pending: {
    apply: (tasks) => tasks.filter(t => t.status === 'pending')
  },

  done: {
    apply: (tasks) => tasks.filter(t => t.status === 'done')
  },

  overdue: {
    apply: (tasks) => tasks.filter(t => t.isOverdue())
  },

  bySubject: (subject) => ({
    apply: (tasks) => tasks.filter(t => t.subject === subject)
  })
};

/**
 * FilterContext
 * Holds the active strategy and applies it.
 * Callers just call context.apply(tasks) — they never know which strategy runs.
 */
export class FilterContext {
  constructor(strategy = FilterStrategies.all) {
    this._strategy = strategy;
  }

  setStrategy(strategy) {
    this._strategy = strategy;
  }

  apply(tasks) {
    return this._strategy.apply(tasks);
  }
}



