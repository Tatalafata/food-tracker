export function localDateKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function localReminderDate(day: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }
  const date = new Date(`${day}T${time}:00`);
  if (localDateKey(date) !== day || date.getHours() !== Number(time.slice(0, 2))
    || date.getMinutes() !== Number(time.slice(3))) return null;
  return date;
}
