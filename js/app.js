import { UIRenderer } from './ui/UIRenderer.js';

const savedTheme = localStorage.getItem('planner_theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  document.getElementById('theme-toggle').textContent = '☀️';
}

new UIRenderer();
