/**
 * UIRenderer
 * Single Responsibility (SOLID): only handles DOM rendering.
 * DRY: all HTML generation is centralized here.
 * Dependency Inversion (SOLID): depends on abstractions (store, filter context), not concretions.
 */

import { taskStore } from '../store/TaskStore.js';
import { FilterContext, FilterStrategies } from '../strategies/FilterStrategy.js';
import { buildSubjectTree } from '../components/TaskComposite.js';
import { TaskFactory } from '../models/Task.js';

export class UIRenderer {
  constructor() {
    this.filterContext = new FilterContext();
    this.activeSubjectFilter = null;
    this.activeStatusFilter = 'all';
    this.editingId = null;

    this._bindElements();
    this._bindEvents();

    // Observer: re-render whenever store changes
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
    this.statsOverdue = document.getElementById('stat-overdue');
    this.formError = document.getElementById('form-error');
    this.submitBtn = document.getElementById('submit-btn');
    this.cancelEditBtn = document.getElementById('cancel-edit-btn');
    this.themeToggle = document.getElementById('theme-toggle');
  }

  _bindEvents() {
    this.form.addEventListener('submit', (e) => this._handleSubmit(e));
    this.filterStatus.addEventListener('change', () => this._applyFilters());
    this.filterSubject.addEventListener('change', () => this._applyFilters());
    this.cancelEditBtn.addEventListener('click', () => this._cancelEdit());
    this.themeToggle.addEventListener('click', () => this._toggleTheme());
  }

  // DRY: one method builds filter strategy from current UI state
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
      // Validate manually for edits (Factory.validate is DRY)
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

  render() {
    const tasks = taskStore.getAll();
    this._renderStats(taskStore.getStats());
    this._renderSubjectFilter(taskStore.getSubjects());
    this._renderList(tasks);
  }

  _renderStats({ total, completed, overdue }) {
    this.statsTotal.textContent = total;
    this.statsDone.textContent = completed;
    this.statsOverdue.textContent = overdue;
  }

  _renderSubjectFilter(subjects) {
    const current = this.filterSubject.value;
    this.filterSubject.innerHTML = '<option value="">All Subjects</option>' +
      subjects.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('');
  }

  _renderList(allTasks) {
    const filtered = this.filterContext.apply(allTasks);

    // Use Composite to group by subject for display
    const groups = buildSubjectTree(filtered);

    if (!groups.length) {
      this.taskList.innerHTML = `<div class="empty-state">
        <span class="empty-icon">📋</span>
        <p>No tasks here yet. Add one above!</p>
      </div>`;
      return;
    }

    // DRY: one render helper for task cards
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

    // Bind card buttons after render
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
    const doneClass = task.isDone() ? 'done' : '';
    const deadlineLabel = task.deadline
      ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '';

    return `
      <div class="task-card ${doneClass} ${overdueClass}">
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
            ${task.isOverdue() ? '<span class="overdue-badge">Overdue</span>' : ''}
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