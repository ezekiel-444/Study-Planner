import { buildSubjectTree } from '../components/TaskComposite.js';

export const StatsStrategies = {
  overview: {
    compute(tasks) {
      const total = tasks.length;
      const completed = tasks.filter(t => t.isDone()).length;
      const overdue = tasks.filter(t => t.isOverdue()).length;
      const pending = total - completed;
      const dueToday = tasks.filter(t => t.isDueToday()).length;
      const dueThisWeek = tasks.filter(t => t.isDueThisWeek()).length;
      const completionRate = total ? Math.round((completed / total) * 100) : 0;

      return { total, completed, pending, overdue, dueToday, dueThisWeek, completionRate };
    }
  },

  bySubject: {
    compute(tasks) {
      return buildSubjectTree(tasks).map(group => ({
        subject: group.getLabel(),
        total: group.getCount(),
        completed: group.getCompletedCount(),
        overdue: group.getOverdueCount(),
        pending: group.getPendingCount(),
        completionRate: group.getCompletionRate()
      }));
    }
  }
};

export class StatsContext {
  constructor(strategy = StatsStrategies.overview) {
    this._strategy = strategy;
  }

  setStrategy(strategy) {
    this._strategy = strategy;
  }

  compute(tasks) {
    return this._strategy.compute(tasks);
  }
}
