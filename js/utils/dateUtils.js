/**
 * Shared date helpers for deadline comparisons.
 * Compares calendar days in local time to avoid timezone bugs with <input type="date">.
 */

export function parseDeadline(deadlineStr) {
  if (!deadlineStr) return null;
  const normalized = deadlineStr.includes('T') ? deadlineStr : `${deadlineStr}T00:00:00`;
  return new Date(normalized);
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function daysBetween(earlier, later) {
  return Math.floor((later - earlier) / (1000 * 60 * 60 * 24));
}

export function isBeforeToday(deadlineStr) {
  const deadline = parseDeadline(deadlineStr);
  if (!deadline) return false;
  return deadline < startOfToday();
}

export function isToday(deadlineStr) {
  const deadline = parseDeadline(deadlineStr);
  if (!deadline) return false;
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return deadline >= today && deadline < tomorrow;
}

export function isWithinDays(deadlineStr, days) {
  const deadline = parseDeadline(deadlineStr);
  if (!deadline) return false;
  const today = startOfToday();
  const end = new Date(today);
  end.setDate(end.getDate() + days);
  return deadline >= today && deadline < end;
}

export function formatDeadline(deadlineStr) {
  if (!deadlineStr) return '';
  return parseDeadline(deadlineStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
