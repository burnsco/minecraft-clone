const DEBUG_PREFIX = '[mc-debug]';

let runtimeLoggingInstalled = false;

const formatMessage = (scope: string, message: string) =>
  `${DEBUG_PREFIX}[${scope}] ${message}`;

export const debugInfo = (scope: string, message: string, details?: unknown) => {
  if (details === undefined) {
    console.info(formatMessage(scope, message));
    return;
  }

  console.info(formatMessage(scope, message), details);
};

export const debugWarn = (scope: string, message: string, details?: unknown) => {
  if (details === undefined) {
    console.warn(formatMessage(scope, message));
    return;
  }

  console.warn(formatMessage(scope, message), details);
};

export const debugError = (scope: string, message: string, details?: unknown) => {
  if (details === undefined) {
    console.error(formatMessage(scope, message));
    return;
  }

  console.error(formatMessage(scope, message), details);
};

export const installRuntimeErrorLogging = () => {
  if (runtimeLoggingInstalled || typeof window === 'undefined') {
    return;
  }

  runtimeLoggingInstalled = true;

  window.addEventListener('error', (event) => {
    debugError('runtime', 'Unhandled window error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    debugError('runtime', 'Unhandled promise rejection', event.reason);
  });

  debugInfo('runtime', 'Global runtime error logging installed');
};
