/**
 * Centralized logging module for Second Brain
 * Only logs in development mode (import.meta.env.DEV)
 */

const isDev = import.meta.env.DEV;

const LOG_STYLES = {
  info: 'color: #54a0ff; font-weight: bold;',
  warn: 'color: #feca57; font-weight: bold;',
  error: 'color: #ff6b6b; font-weight: bold;',
  success: 'color: #00d2a0; font-weight: bold;',
};

function formatTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
}

function formatMessage(level, module, action, details) {
  const timestamp = formatTimestamp();
  return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${action}${details ? ' — ' + (typeof details === 'string' ? details : JSON.stringify(details)) : ''}`;
}

const logger = {
  /**
   * Log informational message (data read start, processing, etc.)
   */
  info(module, action, details = null) {
    if (!isDev) return;
    console.log(`%c[INFO]%c [${formatTimestamp()}] [${module}] ${action}`, LOG_STYLES.info, '', details != null ? details : '');
  },

  /**
   * Log success message (data saved, operation completed)
   */
  success(module, action, details = null) {
    if (!isDev) return;
    console.log(`%c[OK]%c [${formatTimestamp()}] [${module}] ${action}`, LOG_STYLES.success, '', details != null ? details : '');
  },

  /**
   * Log warning message
   */
  warn(module, action, details = null) {
    if (!isDev) return;
    console.warn(`%c[WARN]%c [${formatTimestamp()}] [${module}] ${action}`, LOG_STYLES.warn, '', details != null ? details : '');
  },

  /**
   * Log error with full stack trace
   */
  error(module, action, error) {
    if (!isDev) return;
    const msg = formatMessage('error', module, action);
    console.error(`%c[ERROR]%c ${msg}`, LOG_STYLES.error, '');
    if (error instanceof Error) {
      console.error(`  Cause: ${error.message}`);
      console.error(`  Stack: ${error.stack}`);
    } else if (error != null) {
      console.error(`  Details:`, error);
    }
  },
};

export default logger;
