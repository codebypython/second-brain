// Get current date string in specific timezone (YYYY-MM-DD)
export function getTodayStr(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: timezone, 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
    return formatter.format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

// Get current hour in timezone
export function getCurrentHour(timezone) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: timezone, 
      hour: 'numeric', 
      hour12: false 
    });
    const h = parseInt(formatter.format(new Date()), 10);
    return h === 24 ? 0 : h;
  } catch (e) {
    return new Date().getHours();
  }
}

// Get greeting based on hour
export function getGreetingKey(timezone) {
  const h = getCurrentHour(timezone);
  if (h < 12) return 'dash.morning';
  if (h < 18) return 'dash.afternoon';
  return 'dash.evening';
}

// Format full date in locale and timezone
export function formatFullDate(dateStr, locale, timezone) {
  try {
    // dateStr is YYYY-MM-DD, parse as local to that timezone
    const [y, m, d] = dateStr.split('-');
    const date = new Date();
    // A bit hacky, but robust enough for display
    const formatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    // Set actual UTC date to match the YYYY-MM-DD at 12:00 in that timezone to avoid shifts
    const utcDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return formatter.format(utcDate);
  } catch (e) {
    return dateStr;
  }
}

// List of common timezones for the selector
export const TIMEZONES = [
  'Asia/Ho_Chi_Minh',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Australia/Sydney',
  'UTC'
];
