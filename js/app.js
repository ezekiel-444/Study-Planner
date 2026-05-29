/**
 * app.js — Entry Point
 * Bootstraps the app: initializes theme and renders UI.
 */

import { UIRenderer } from './ui/UIRenderer.js';

// Restore saved theme before first paint
const savedTheme = localStorage.getItem('planner_theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('theme-toggle').textContent = '☀️';
}

// Boot the renderer (Singleton store auto-initializes inside)
new UIRenderer();