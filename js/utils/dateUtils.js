const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const parseDeadline = str => {
  if (!str) return null;
  return new Date(str.includes('T') ? str : `${str}T00:00:00`);
};

export const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

export const daysBetween = (earlier, later) =>
  Math.floor((later - earlier) / MS_PER_DAY);

export const isBeforeToday = str => {
  const deadline = parseDeadline(str);
  return deadline ? deadline < startOfToday() : false;
};

export const isToday = str => {
  const deadline = parseDeadline(str);
  if (!deadline) return false;
  const today = startOfToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return deadline >= today && deadline < tomorrow;
};

export const isWithinDays = (str, days) => {
  const deadline = parseDeadline(str);
  if (!deadline) return false;
  const today = startOfToday();
  const end = new Date(today);
  end.setDate(end.getDate() + days);
  return deadline >= today && deadline < end;
};

export const formatDeadline = str => {
  if (!str) return '';
  return parseDeadline(str).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};
