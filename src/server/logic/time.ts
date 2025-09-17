import { DateTime } from 'luxon';

export const DEFAULT_TIMEZONE = process.env.APP_TZ || 'Australia/Sydney';

export function nowInTz(tz = DEFAULT_TIMEZONE) {
  return DateTime.now().setZone(tz);
}

export function toZonedDateTime(iso: string | null | undefined, tz = DEFAULT_TIMEZONE) {
  if (!iso) return null;
  const dt = DateTime.fromISO(iso, { zone: tz });
  return dt.isValid ? dt : null;
}

export function ensureFuture(dateTime: DateTime, reference: DateTime) {
  if (dateTime < reference) {
    return reference.plus({ minutes: 15 });
  }
  return dateTime;
}

export function normalizeTitle(raw: string) {
  return raw.replace(/[。！!、,;；]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function iso(dateTime: DateTime | null) {
  return dateTime?.toISO() ?? null;
}
