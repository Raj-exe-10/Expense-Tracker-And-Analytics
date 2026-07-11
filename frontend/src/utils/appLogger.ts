/**
 * Unified console logging for frontend debugging (pairs with backend SystemLog).
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[LedgerCore]';

function emit(level: LogLevel, category: string, message: string, detail?: unknown) {
  const line = `${PREFIX} [${category}] ${message}`;
  const args = detail !== undefined ? [line, detail] : [line];
  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(...args);
      }
      break;
    case 'info':
      console.info(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'error':
      console.error(...args);
      break;
    default:
      console.log(...args);
  }
}

export const appLogger = {
  debug: (category: string, message: string, detail?: unknown) =>
    emit('debug', category, message, detail),
  info: (category: string, message: string, detail?: unknown) =>
    emit('info', category, message, detail),
  warn: (category: string, message: string, detail?: unknown) =>
    emit('warn', category, message, detail),
  error: (category: string, message: string, detail?: unknown) =>
    emit('error', category, message, detail),
  api: (method: string, url: string, status: number, durationMs?: number) => {
    const msg = `${method} ${url} -> ${status}${durationMs != null ? ` (${durationMs}ms)` : ''}`;
    if (status >= 500) emit('error', 'HTTP', msg);
    else if (status >= 400) emit('warn', 'HTTP', msg);
    else emit('info', 'HTTP', msg);
  },
  auth: (message: string, detail?: unknown) => emit('info', 'auth', message, detail),
  route: (pathname: string) => emit('debug', 'route', pathname),
};
