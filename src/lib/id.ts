/** Short, collision-resistant id for local records (not cryptographically secure). */
export function createId(prefix = ''): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}${time}${random}`;
}
