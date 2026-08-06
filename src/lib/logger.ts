type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

const isDevelopment = process.env.NODE_ENV === "development";

function formatLog(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  return {
    timestamp,
    level,
    message,
    context,
    formatted: `${prefix} ${message}`,
  };
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      const log = formatLog("debug", message, context);
      console.debug(log.formatted, context || "");
    }
  },

  info: (message: string, context?: LogContext) => {
    const log = formatLog("info", message, context);
    console.info(log.formatted, context || "");
  },

  warn: (message: string, context?: LogContext) => {
    const log = formatLog("warn", message, context);
    console.warn(log.formatted, context || "");
  },

  error: (message: string, error?: any, context?: LogContext) => {
    // FirebaseError (and many native errors) have non-enumerable properties,
    // so spreading produces {}. Normalise to a plain object first.
    const normalizedError = error instanceof Error
      ? { message: error.message, name: error.name, code: (error as any).code, stack: error.stack }
      : error;
    const log = formatLog("error", message, { ...context, error: normalizedError });
    console.error(log.formatted, normalizedError ?? context ?? "");

    // Em produção, você poderia enviar para Sentry aqui
    if (!isDevelopment && error) {
      // Example: Sentry.captureException(error, { extra: context });
    }
  },

  /**
   * Log de requisições HTTP
   */
  httpRequest: (
    method: string,
    url: string,
    status: number,
    duration: number
  ) => {
    const log = formatLog("info", `HTTP ${method} ${url}`, {
      status,
      duration: `${duration}ms`,
    });
    console.info(log.formatted);
  },

  /**
   * Log de ações de usuário
   */
  userAction: (action: string, userId: string, context?: LogContext) => {
    const log = formatLog("info", `User action: ${action}`, {
      userId,
      ...context,
    });
    console.info(log.formatted);
  },

  /**
   * Log de performance
   */
  performance: (metric: string, duration: number, context?: LogContext) => {
    const log = formatLog("debug", `Performance: ${metric}`, {
      duration: `${duration}ms`,
      ...context,
    });
    console.debug(log.formatted);
  },
};

/**
 * Hook para medir performance
 */
export function measurePerformance(label: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      logger.performance(label, duration);
      return duration;
    },
  };
}
