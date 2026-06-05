/**
 * UIRenderer
 * Single Responsibility (SOLID): only handles DOM rendering.
 * Observer Pattern: subscribes to TaskStore and re-renders on changes.
 */
import { taskStore } from '../store/TaskStore.js';
import { FilterContext, FilterStrategies } from '../strategies/FilterStrategy.js';
import { buildSubjectTree, sortTasksForDisplay } from '../components/TaskComposite.js';
import { TaskFactory } from '../models/Task.js';
import { formatDeadline } from '../utils/dateUtils.js';

export class UIRenderer {
  constructor() {
    this.filterContext = new FilterContext();
    this.activeSubjectFilter = null;
    this.activeStatusFilter = 'all';
    this.editingId = null;

    this._bindElements();
    this._bindEvents();

    taskStore.subscribe(() => this.render());
    this.render();
  }

  _bindElements() {
    this.taskList = document.getElementById('task-list');
    this.form = document.getElementById('task-form');
    this.filterStatus = document.getElementById('filter-status');
    this.filterSubject = document.getElementById('filter-subject');
    this.statsTotal = document.getElementById('stat-total');
    this.statsDone = document.getElementById('stat-done');
    this.statsPending = document.getElementById('stat-pending');
    this.statsOverdue = document.getElementById('stat-overdue');
    this.statsDueWeek = document.getElementById('stat-due-week');
    this.statsRate = document.getElementById('stat-rate');
    this.subjectStats = document.getElementById('subject-stats');
    this.formError = document.getElementById('form-error');
    this.submitBtn = document.getElementById('submit-btn');
    this.cancelEditBtn = document.getElementById('cancel-edit-btn');
    this.themeToggle = document.getElementById('theme-toggle');
    this.exportBtn = document.getElementById('export-btn');
    this.importBtn = document.getElementById('import-btn');
    this.importInput = document.getElementById('import-input');
    this.undoBtn = document.getElementById('undo-btn');
  }

  _bindEvents() {
    this.form.addEventListener('submit', (e) => this._handleSubmit(e));
    this.filterStatus.addEventListener('change', () => this._applyFilters());
    this.filterSubject.addEventListener('change', () => this._applyFilters());
    this.cancelEditBtn.addEventListener('click', () => this._cancelEdit());
    this.themeToggle.addEventListener('click', () => this._toggleTheme());
    this.exportBtn.addEventListener('click', () => this._exportBackup());
    this.importBtn.addEventListener('click', () => this.importInput.click());
    this.importInput.addEventListener('change', (e) => this._importBackup(e));
    this.undoBtn.addEventListener('click', () => this._undoDelete());
  }

  _applyFilters() {
    this.activeStatusFilter = this.filterStatus.value;
    this.activeSubjectFilter = this.filterSubject.value;

    if (this.activeSubjectFilter) {
      this.filterContext.setStrategy(FilterStrategies.bySubject(this.activeSubjectFilter));
    } else {
      this.filterContext.setStrategy(FilterStrategies[this.activeStatusFilter] || FilterStrategies.all);
    }

    this._renderList(taskStore.getAll());
  }

  _handleSubmit(e) {
    e.preventDefault();
    const data = this._getFormData();

    if (this.editingId) {
      const errors = TaskFactory.validate(data);
      if (errors.length) return this._showError(errors.join(', '));
      taskStore.update(this.editingId, data);
      this._cancelEdit();
    } else {
      try {
        taskStore.add(data);
        this.form.reset();
        this._showError('');
      } catch (err) {
        this._showError(err.message);
      }
    }
  }

  _getFormData() {
    return {
      subject: document.getElementById('input-subject').value.trim(),
      title: document.getElementById('input-title').value.trim(),
      deadline: document.getElementById('input-deadline').value,
      notes: document.getElementById('input-notes').value.trim(),
      status: document.getElementById('input-status')?.value || 'pending'
    };
  }

  _showError(msg) {
    this.formError.textContent = msg;
    this.formError.style.display = msg ? 'block' : 'none';
  }

  _startEdit(id) {
    const task = taskStore.getAll().find(t => t.id === id);
    if (!task) return;

    this.editingId = id;
    document.getElementById('input-subject').value = task.subject;
    document.getElementById('input-title').value = task.title;
    document.getElementById('input-deadline').value = task.deadline;
    document.getElementById('input-notes').value = task.notes;

    this.submitBtn.textContent = 'Save Changes';
    this.cancelEditBtn.style.display = 'inline-flex';
    document.getElementById('form-title').textContent = 'Edit Task';
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
  }

  _cancelEdit() {
    this.editingId = null;
    this.form.reset();
    this.submitBtn.textContent = 'Add Task';
    this.cancelEditBtn.style.display = 'none';
    document.getElementById('form-title').textContent = 'New Task';
    this._showError('');
  }

  _toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    this.themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('planner_theme', isDark ? 'dark' : 'light');
  }

  _exportBackup() {
    const json = taskStore.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async _importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const json = await file.text();
      taskStore.importBackup(json);
      this._showError('');
    } catch (err) {
      this._showError(err.message || 'Could not import backup file');
    } finally {
      event.target.value = '';
    }
  }

  _undoDelete() {
    const restored = taskStore.undoLastRemove();
    if (!restored) {
      this._showError('Nothing to undo');
      setTimeout(() => this._showError(''), 2000);
    }
  }

  render() {
    const tasks = taskStore.getAll();
    this._renderStats(taskStore.getStats());
    this._renderSubjectStats(taskStore.getSubjectStats());
    this._renderSubjectFilter(taskStore.getSubjects());
    this._renderList(tasks);
  }

  _renderStats({ total, completed, pending, overdue, dueThisWeek, completionRate }) {
    this.statsTotal.textContent = total;
    this.statsDone.textContent = completed;
    this.statsPending.textContent = pending;
    this.statsOverdue.textContent = overdue;
    this.statsDueWeek.textContent = dueThisWeek;
    this.statsRate.textContent = `${completionRate}%`;
  }

  _renderSubjectStats(rows) {
    if (!rows.length) {
      this.subjectStats.innerHTML = '<p class="subject-stats-empty">Add tasks to see per-subject statistics.</p>';
      return;
    }

    this.subjectStats.innerHTML = `
      <table class="subject-stats-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Total</th>
            <th>Done</th>
            <th>Pending</th>
            <th>Overdue</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td>${row.subject}</td>
              <td>${row.total}</td>
              <td>${row.completed}</td>
              <td>${row.pending}</td>
              <td class="${row.overdue ? 'cell-overdue' : ''}">${row.overdue}</td>
              <td>${row.completionRate}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  _renderSubjectFilter(subjects) {
    const current = this.filterSubject.value;
    this.filterSubject.innerHTML = '<option value="">All Subjects</option>' +
      subjects.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
  }

  _renderList(allTasks) {
    const filtered = sortTasksForDisplay(this.filterContext.apply(allTasks));
    const groups = buildSubjectTree(filtered);

    if (!groups.length) {
      this.taskList.innerHTML = `<div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No tasks here yet. Add one above!</p>
      </div>`;
      return;
    }

    this.taskList.innerHTML = groups.map(group => `
      <div class="subject-group">
        <h3 class="subject-label">
          <span class="subject-dot"></span>
          ${group.getLabel()}
          <span class="subject-count">${group.getCount()}</span>
        </h3>
        ${group.getItems().map(task => this._taskCard(task)).join('')}
      </div>
    `).join('');

    this.taskList.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        if (action === 'toggle') taskStore.toggle(id);
        if (action === 'delete') this._confirmDelete(id);
        if (action === 'edit') this._startEdit(id);
      });
    });
  }

  _confirmDelete(id) {
    if (confirm('Delete this task?')) taskStore.remove(id);
  }

  _taskCard(task) {
    const overdueClass = task.isOverdue() ? 'overdue' : '';
    const dueTodayClass = task.isDueToday() ? 'due-today' : '';
    const doneClass = task.isDone() ? 'done' : '';
    const deadlineLabel = formatDeadline(task.deadline);
    const daysOverdue = task.daysOverdue();
    const overdueLabel = daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`;

    return `
      <div class="task-card ${doneClass} ${overdueClass} ${dueTodayClass}">
        <div class="task-check">
          <button class="check-btn ${task.isDone() ? 'checked' : ''}" data-action="toggle" data-id="${task.id}" title="Toggle done">
            ${task.isDone() ? '✓' : ''}
          </button>
        </div>
        <div class="task-body">
          <div class="task-title">${task.title}</div>
          ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
          <div class="task-meta">
            ${deadlineLabel ? `<span class="deadline-badge ${overdueClass}">📅 ${deadlineLabel}</span>` : ''}
            ${task.isOverdue() ? `<span class="overdue-badge">${overdueLabel}</span>` : ''}
            ${task.isDueToday() && !task.isDone() ? '<span class="due-today-badge">Due Today</span>' : ''}
            ${task.isDone() ? '<span class="done-badge">Done</span>' : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon edit-btn" data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
          <button class="btn-icon delete-btn" data-action="delete" data-id="${task.id}" title="Delete">🗑️</button>
        </div>
      </div>`;
  }
}
