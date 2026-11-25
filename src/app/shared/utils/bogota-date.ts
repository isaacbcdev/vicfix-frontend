/** Bogota calendar date (YYYY-MM-DD); toISOString() is UTC and rolls over at 7 p.m. local. */
export function bogotaToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
}
