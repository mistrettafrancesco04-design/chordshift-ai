const relative = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });

/** "vor 5 Minuten", "gestern", … */
export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.round((timestamp - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, 'second');
  if (abs < 3600) return relative.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), 'hour');
  if (abs < 604800) return relative.format(Math.round(seconds / 86400), 'day');
  return new Date(timestamp).toLocaleDateString('de-DE');
}

export function formatSemitones(semitones: number): string {
  if (semitones === 0) return '±0';
  return semitones > 0 ? `+${semitones}` : `−${Math.abs(semitones)}`;
}
