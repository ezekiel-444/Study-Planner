/**
 * UIRenderer
 * Single Responsibility (SOLID): only handles DOM rendering.
 * Observer Pattern: subscribes to TaskStore and re-renders on changes.
 */
import { taskStore } from '../store/TaskStore.js';
import { applyCombinedFilters } from '../strategies/FilterStrategy.js';
import { buildSubjectTree, sortTasksForDisplay } from '../components/TaskComposite.js';
import { TaskFactory } from '../models/Task.js';
import { formatDeadline } from '../utils/dateUtils.js';
import { escapeHtml } from '../utils/domUtils.js';

export class UIRenderer {
  constructor() {
    this.activeSubjectFilter = '';
    this.activeStatusFilter = 'all';
    this.editingId = null;
    this._toastTimer = null;

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
    this.filterSummary = document.getElementById('filter-summary');
    this.statsTotal = document.getElementById('stat-total');
    this.statsDone = document.getElementById('stat-done');
    this.statsPending = document.getElementById('stat-pending');
    this.statsOverdue = document.getElementById('stat-overdue');
    this.statsDueToday = document.getElementById('stat-due-today');
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
    this.toast = document.getElementById('toast');
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

    this.taskList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const { action, id } = btn.dataset;
      if (action === 'toggle') taskStore.toggle(id);
      if (action === 'delete') this._confirmDelete(id);
      if (action === 'edit') this._startEdit(id);
    });
  }

  _applyFilters() {
    this.activeStatusFilter = this.filterStatus.value;
    this.activeSubjectFilter = this.filterSubject.value;
    this._renderList(taskStore.getAll());
    this._updateFilterSummary();
  }

  _updateFilterSummary() {
    const statusLabel = this.filterStatus.options[this.filterStatus.selectedIndex].text;
    const subjectLabel = this.activeSubjectFilter || 'All Subjects';

    if (this.activeStatusFilter === 'all' && !this.activeSubjectFilter) {
      this.filterSummary.textContent = 'Showing all tasks';
      return;
    }

    this.filterSummary.textContent = `Showing: ${statusLabel} · ${subjectLabel}`;
  }

  _handleSubmit(e) {
    e.preventDefault();
    const data = this._getFormData();

    if (this.editingId) {
      const errors = TaskFactory.validate(data);
      if (errors.length) return this._showError(errors.join(', '));

      try {
        taskStore.update(this.editingId, data);
        this._cancelEdit();
        this._showToast('Task updated successfully');
      } catch (err) {
        this._showError(err.message);
      }
    } else {
      try {
        taskStore.add(data);
        this.form.reset();
        this._showError('');
        this._showToast('Task added successfully');
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
      notes: document.getElementById('input-notes').value.trim()
    };
  }

  _showError(msg) {
    this.formError.textContent = msg;
    this.formError.style.display = msg ? 'block' : 'none';
  }

  _showToast(message, type = 'success') {
    if (!this.toast) return;

    clearTimeout(this._toastTimer);
    this.toast.textContent = message;
    this.toast.className = `toast toast-${type} toast-visible`;
    this.toast.setAttribute('role', 'status');

    this._toastTimer = setTimeout(() => {
      this.toast.classList.remove('toast-visible');
    }, 2800);
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
    this._showError('');
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
    this._showToast('Backup exported');
  }

  async _importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const taskCount = taskStore.getAll().length;
    const message = taskCount
      ? `Import will replace all ${taskCount} current task(s). Continue?`
      : 'Import tasks from this backup file?';

    if (!confirm(message)) {
      event.target.value = '';
      return;
    }

    try {
      const json = await file.text();
      taskStore.importBackup(json);
      this._showToast(`Imported ${taskStore.getAll().length} task(s)`);
    } catch (err) {
      this._showToast(err.message || 'Could not import backup file', 'error');
    } finally {
      event.target.value = '';
    }
  }

  _undoDelete() {
    const restored = taskStore.undoLastRemove();
    if (restored) {
      this._showToast('Delete undone');
    } else {
      this._showToast('Nothing to undo', 'error');
    }
  }

  render() {
    const tasks = taskStore.getAll();
    this._renderStats(taskStore.getStats());
    this._renderSubjectStats(taskStore.getSubjectStats());
    this._renderSubjectFilter(taskStore.getSubjects());
    this._renderList(tasks);
    this._updateFilterSummary();
  }

  _renderStats({ total, completed, pending, overdue, dueToday, dueThisWeek, completionRate }) {
    this.statsTotal.textContent = total;
    this.statsDone.textContent = completed;
    this.statsPending.textContent = pending;
    this.statsOverdue.textContent = overdue;
    this.statsDueToday.textContent = dueToday;
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
              <td>${escapeHtml(row.subject)}</td>
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
      subjects.map(s =>
        `<option value="${escapeHtml(s)}" ${s === current ? 'selected' : ''}>${escapeHtml(s)}</option>`
      ).join('');
  }

  _renderList(allTasks) {
    const filtered = sortTasksForDisplay(
      applyCombinedFilters(allTasks, this.activeStatusFilter, this.activeSubjectFilter)
    );
    const groups = buildSubjectTree(filtered);

    if (!groups.length) {
      const hasTasks = allTasks.length > 0;
      this.taskList.innerHTML = `<div class="empty-state">
        <span class="empty-icon">${hasTasks ? '🔍' : '📋'}</span>
        <p>${hasTasks ? 'No tasks match the current filters.' : 'No tasks yet. Add one above!'}</p>
      </div>`;
      return;
    }

    this.taskList.innerHTML = groups.map(group => `
      <div class="subject-group">
        <h3 class="subject-label">
          <span class="subject-dot"></span>
          ${escapeHtml(group.getLabel())}
          <span class="subject-count">${group.getCount()}</span>
        </h3>
        ${group.getItems().map(task => this._taskCard(task)).join('')}
      </div>
    `).join('');
  }

  _confirmDelete(id) {
    if (confirm('Delete this task?')) {
      taskStore.remove(id);
      this._showToast('Task deleted — use Undo to restore');
    }
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
          <button class="check-btn ${task.isDone() ? 'checked' : ''}" data-action="toggle" data-id="${task.id}" title="Mark as ${task.isDone() ? 'not done' : 'done'}" aria-label="Mark as ${task.isDone() ? 'not done' : 'done'}">
            ${task.isDone() ? '✓' : ''}
          </button>
        </div>
        <div class="task-body">
          <div class="task-title">${escapeHtml(task.title)}</div>
          ${task.notes ? `<div class="task-notes">${escapeHtml(task.notes)}</div>` : ''}
          <div class="task-meta">
            ${deadlineLabel ? `<span class="deadline-badge ${overdueClass}">📅 ${escapeHtml(deadlineLabel)}</span>` : ''}
            ${task.isOverdue() ? `<span class="overdue-badge">${escapeHtml(overdueLabel)}</span>` : ''}
            ${task.isDueToday() && !task.isDone() ? '<span class="due-today-badge">Due Today</span>' : ''}
            ${task.isDone() ? '<span class="done-badge">Done</span>' : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn-icon edit-btn" data-action="edit" data-id="${task.id}" title="Edit" aria-label="Edit task">✏️</button>
          <button class="btn-icon delete-btn" data-action="delete" data-id="${task.id}" title="Delete" aria-label="Delete task">🗑️</button>
        </div>
      </div>`;
  }
}
