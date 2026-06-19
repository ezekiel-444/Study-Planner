import { buildSubjectTree } from '../components/TaskComposite.js';

const count = (tasks, fn) => tasks.filter(fn).length;

const mapGroup = group => ({
  subject: group.getLabel(),
  total: group.getCount(),
  completed: group.getCompletedCount(),
  overdue: group.getOverdueCount(),
  pending: group.getPendingCount(),
  completionRate: group.getCompletionRate()
});

export const StatsStrategies = {
  overview: {
    compute(tasks) {
      const total = tasks.length;
      const completed = count(tasks, t => t.isDone());
      const overdue = count(tasks, t => t.isOverdue());
      const dueToday = count(tasks, t => t.isDueToday());
      const dueThisWeek = count(tasks, t => t.isDueThisWeek());
      const pending = total - completed;
      const completionRate = total ? Math.round((completed / total) * 100) : 0;

      return { total, completed, pending, overdue, dueToday, dueThisWeek, completionRate };
    }
  },

  bySubject: {
    compute(tasks) {
      return buildSubjectTree(tasks).map(mapGroup);
    }
  }
};

export class StatsContext {
  #strategy;

  constructor(strategy = StatsStrategies.overview) {
    this.#strategy = strategy;
  }

  setStrategy(strategy) {
    this.#strategy = strategy;
  }

  compute(tasks) {
    return this.#strategy.compute(tasks);
  }
}
